import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { generateToken, hashToken } from '#core/security/token.js';
import { addDuration } from '#core/utils/duration.js';
import { AuthToken } from './authToken.model.js';

export const authTokenService = {
  /**
   * Phát hành token dùng một lần. Token cũ CÙNG loại chưa dùng của email này bị huỷ
   * (chỉ link mới nhất có hiệu lực).
   * @param {{ type: string, email: string, userId?: any, ttl: string, meta?: object }} params
   * @returns {Promise<string>} token gốc (để gửi qua email)
   */
  async issue({ type, email, userId = null, ttl, meta }) {
    await AuthToken.deleteMany({ type, email, usedAt: null });
    const token = generateToken(32);
    await AuthToken.create({
      type,
      email,
      user: userId,
      tokenHash: hashToken(token),
      expiresAt: addDuration(ttl),
      meta,
    });
    return token;
  },

  /**
   * Tiêu thụ token (atomic): chỉ thành công 1 lần, còn hạn và đúng loại.
   * @returns {Promise<import('mongoose').Document & { email: string, user: any, meta?: any }>}
   */
  async consume(type, token) {
    const now = new Date();
    const record = await AuthToken.findOneAndUpdate(
      { type, tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
      { returnDocument: 'after' },
    );
    if (!record) {
      throw AppError.badRequest(
        'Liên kết không hợp lệ hoặc đã hết hạn',
        undefined,
        ErrorCodes.INVALID_TOKEN,
      );
    }
    return record;
  },
};
