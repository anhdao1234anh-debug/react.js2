// Phương thức 1: Email + mật khẩu (đăng ký, đăng nhập, xác thực email, quên/đổi mật khẩu).
import { env } from '#config/env.js';
import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { createLogger } from '#core/logger/logger.js';
import { sendMail } from '#core/mail/mailer.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '#core/security/password.js';
import { userRepository } from '#modules/user/user.repository.js';
import { resetPasswordEmail, verifyEmailEmail } from './auth.emails.js';
import { AUTH_TOKEN_TYPES } from './authToken.model.js';
import { authTokenService } from './authToken.service.js';
import { sessionService } from './session.service.js';

const log = createLogger('auth');

async function sendVerificationEmail(user) {
  const token = await authTokenService.issue({
    type: AUTH_TOKEN_TYPES.EMAIL_VERIFY,
    email: user.email,
    userId: user._id,
    ttl: env.EMAIL_VERIFY_EXPIRES_IN,
  });
  await sendMail({ to: user.email, ...verifyEmailEmail({ token, name: user.name }) });
}

export const passwordAuthService = {
  /** Đăng ký + tự đăng nhập. Gửi email xác thực (lỗi gửi mail không chặn đăng ký). */
  async register({ name, email, password }, context) {
    if (await userRepository.exists({ email })) {
      throw AppError.conflict('Email đã được sử dụng', { fields: ['email'] });
    }
    const user = await userRepository.create({
      name,
      email,
      passwordHash: await hashPassword(password),
    });

    await sendVerificationEmail(user).catch((error) =>
      log.error({ err: error, userId: user.id }, 'Gửi email xác thực thất bại'),
    );

    return sessionService.signIn(user, { method: 'password', ...context });
  },

  async login({ email, password }, context) {
    const user = await userRepository.findByEmail(email, { withPassword: true });
    // Luôn verify (kể cả khi không có user) để thời gian phản hồi đồng nhất
    const isValid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || !user.passwordHash || !isValid) {
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng', ErrorCodes.INVALID_CREDENTIALS);
    }
    if (!user.isActive) {
      throw AppError.forbidden('Tài khoản đã bị khoá', ErrorCodes.ACCOUNT_DISABLED);
    }
    return sessionService.signIn(user, { method: 'password', ...context });
  },

  async resendVerification(user) {
    if (user.emailVerifiedAt) throw AppError.badRequest('Email đã được xác thực trước đó');
    await sendVerificationEmail(user);
  },

  async verifyEmail(token) {
    const record = await authTokenService.consume(AUTH_TOKEN_TYPES.EMAIL_VERIFY, token);
    const user = await userRepository.findById(record.user);
    if (!user) throw AppError.notFound('Người dùng');
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
      await user.save();
    }
    return user;
  },

  /** Luôn "thành công" với client dù email không tồn tại (chống dò email). */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) return;
    const token = await authTokenService.issue({
      type: AUTH_TOKEN_TYPES.PASSWORD_RESET,
      email: user.email,
      userId: user._id,
      ttl: env.PASSWORD_RESET_EXPIRES_IN,
    });
    await sendMail({ to: user.email, ...resetPasswordEmail({ token, name: user.name }) });
  },

  /** Đặt lại mật khẩu -> thu hồi MỌI phiên đăng nhập (an toàn nếu tài khoản từng bị lộ). */
  async resetPassword({ token, password }) {
    const record = await authTokenService.consume(AUTH_TOKEN_TYPES.PASSWORD_RESET, token);
    const user = await userRepository.findById(record.user);
    if (!user) throw AppError.notFound('Người dùng');

    user.passwordHash = await hashPassword(password);
    user.passwordChangedAt = new Date();
    // Nhận được email reset => chứng minh sở hữu email
    user.emailVerifiedAt ??= new Date();
    await user.save();
    await sessionService.revokeAllForUser(user._id, { reason: 'password_reset' });
  },

  /**
   * Đổi mật khẩu khi đang đăng nhập. User chưa có mật khẩu (OAuth/magic link) được đặt mới
   * mà không cần currentPassword. Giữ session hiện tại, thu hồi các session khác.
   */
  async changePassword(userId, { currentPassword, newPassword }, { currentSessionId } = {}) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw AppError.notFound('Người dùng');

    if (user.passwordHash) {
      const isValid = currentPassword && (await verifyPassword(currentPassword, user.passwordHash));
      if (!isValid) {
        throw AppError.badRequest(
          'Mật khẩu hiện tại không đúng',
          [{ location: 'body', path: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }],
          ErrorCodes.INVALID_CREDENTIALS,
        );
      }
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();
    await sessionService.revokeAllForUser(user._id, {
      exceptSessionId: currentSessionId,
      reason: 'password_changed',
    });
    return user;
  },
};
