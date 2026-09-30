// Quản lý phiên đăng nhập bằng refresh token xoay vòng (rotation) + phát hiện dùng lại (reuse detection).
import { env } from '#config/env.js';
import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { createLogger } from '#core/logger/logger.js';
import { signAccessToken } from '#core/security/jwt.js';
import { generateToken, hashToken } from '#core/security/token.js';
import { addDuration } from '#core/utils/duration.js';
import { userRepository } from '#modules/user/user.repository.js';
import { Session } from './session.model.js';

const log = createLogger('session');

/** Khoảng thời gian token cũ vẫn được chấp nhận sau khi xoay (nhiều tab refresh cùng lúc). */
export const REFRESH_REUSE_GRACE_MS = 30_000;

const REFRESH_TOKEN_BYTES = 48;

/** @typedef {{ userAgent?: string, ip?: string }} RequestContext */

const newExpiry = () => addDuration(env.REFRESH_TOKEN_EXPIRES_IN);

const issueAccessToken = (user, session) =>
  signAccessToken({ sub: user.id, role: user.role, sid: session.id });

function assertSessionUsable(session, now) {
  if (session.revokedAt) {
    throw AppError.unauthorized('Phiên đăng nhập đã bị thu hồi', ErrorCodes.SESSION_REVOKED);
  }
  if (session.expiresAt <= now) {
    throw AppError.unauthorized('Phiên đăng nhập đã hết hạn', ErrorCodes.TOKEN_EXPIRED);
  }
}

async function loadActiveUser(session) {
  const user = await userRepository.findByIdWithPassword(session.user);
  if (!user || !user.isActive) {
    await Session.updateOne(
      { _id: session._id },
      { revokedAt: new Date(), revokedReason: 'user_inactive' },
    );
    throw AppError.unauthorized('Tài khoản không khả dụng', ErrorCodes.SESSION_REVOKED);
  }
  return user;
}

export const sessionService = {
  /**
   * Tạo session mới cho user.
   * @param {import('mongoose').Document & { id: string, role: string }} user
   * @param {RequestContext & { method: string }} context
   */
  async createSession(user, { method, userAgent, ip }) {
    const refreshToken = generateToken(REFRESH_TOKEN_BYTES);
    const session = await Session.create({
      user: user._id,
      tokenHash: hashToken(refreshToken),
      method,
      userAgent: userAgent?.slice(0, 500),
      ip,
      expiresAt: newExpiry(),
    });
    return { session, refreshToken, accessToken: issueAccessToken(user, session) };
  },

  /**
   * Đăng nhập thành công (mọi phương thức đều đi qua đây): cập nhật lastLoginAt + tạo session.
   * @returns {Promise<{ user: any, accessToken: string, refreshToken: string }>}
   */
  async signIn(user, context) {
    user.lastLoginAt = new Date();
    await user.save();
    const { accessToken, refreshToken } = await this.createSession(user, context);
    return { user, accessToken, refreshToken };
  },

  /**
   * Đổi refresh token lấy access token mới + xoay refresh token.
   * refreshToken trả về = null nghĩa là KHÔNG cần set lại cookie (request song song trong grace period).
   * @param {string | undefined} refreshToken
   * @param {RequestContext} context
   */
  async refresh(refreshToken, { userAgent, ip } = {}) {
    if (!refreshToken) throw AppError.unauthorized('Không tìm thấy phiên đăng nhập');

    const now = new Date();
    const tokenHash = hashToken(refreshToken);

    // 1) Token hiện tại của một session -> xoay token
    const current = await Session.findOne({ tokenHash });
    if (current) {
      assertSessionUsable(current, now);
      const user = await loadActiveUser(current);
      const nextToken = generateToken(REFRESH_TOKEN_BYTES);
      const rotated = await Session.findOneAndUpdate(
        { _id: current._id, tokenHash, revokedAt: null },
        {
          $set: {
            tokenHash: hashToken(nextToken),
            previousTokenHash: tokenHash,
            rotatedAt: now,
            lastUsedAt: now,
            expiresAt: newExpiry(),
            ...(userAgent && { userAgent: userAgent.slice(0, 500) }),
            ...(ip && { ip }),
          },
        },
        { returnDocument: 'after' },
      );
      // Request khác vừa xoay trước (race) -> vẫn hợp lệ, không phát token mới
      if (!rotated)
        return { user, accessToken: issueAccessToken(user, current), refreshToken: null };
      return { user, accessToken: issueAccessToken(user, rotated), refreshToken: nextToken };
    }

    // 2) Token cũ (vừa bị xoay)
    const previous = await Session.findOne({ previousTokenHash: tokenHash });
    if (!previous)
      throw AppError.unauthorized('Phiên đăng nhập không hợp lệ', ErrorCodes.INVALID_TOKEN);

    assertSessionUsable(previous, now);
    if (now - previous.rotatedAt <= REFRESH_REUSE_GRACE_MS) {
      const user = await loadActiveUser(previous);
      return { user, accessToken: issueAccessToken(user, previous), refreshToken: null };
    }

    // 3) Token cũ bị dùng lại sau grace period => nghi bị đánh cắp -> thu hồi cả session
    await Session.updateOne(
      { _id: previous._id },
      { revokedAt: now, revokedReason: 'reuse_detected' },
    );
    log.warn(
      { sessionId: previous.id, userId: String(previous.user) },
      'Refresh token reuse detected',
    );
    throw AppError.unauthorized(
      'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại',
      ErrorCodes.SESSION_REVOKED,
    );
  },

  /** Thu hồi session ứng với refresh token (đăng xuất). Không báo lỗi nếu không tìm thấy. */
  async revokeByToken(refreshToken, reason = 'logout') {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    await Session.updateOne(
      { $or: [{ tokenHash }, { previousTokenHash: tokenHash }], revokedAt: null },
      { revokedAt: new Date(), revokedReason: reason },
    );
  },

  /** Thu hồi mọi session của user (tuỳ chọn giữ lại session hiện tại). */
  async revokeAllForUser(userId, { exceptSessionId, reason = 'logout_all' } = {}) {
    const filter = { user: userId, revokedAt: null };
    if (exceptSessionId) filter._id = { $ne: exceptSessionId };
    const result = await Session.updateMany(filter, {
      revokedAt: new Date(),
      revokedReason: reason,
    });
    return result.modifiedCount;
  },

  async revokeSessionOfUser(userId, sessionId) {
    const result = await Session.updateOne(
      { _id: sessionId, user: userId, revokedAt: null },
      { revokedAt: new Date(), revokedReason: 'revoked_by_user' },
    );
    if (result.matchedCount === 0) throw AppError.notFound('Phiên đăng nhập');
  },

  /** Danh sách thiết bị đang đăng nhập. */
  listActiveSessions(userId) {
    return Session.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ lastUsedAt: -1 })
      .exec();
  },
};
