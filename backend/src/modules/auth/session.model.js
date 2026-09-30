import mongoose from 'mongoose';
import { toJSONPlugin } from '#core/database/plugins/toJSON.js';

/**
 * Một Session = một lần đăng nhập trên một thiết bị (một "token family").
 * - tokenHash: hash của refresh token HIỆN TẠI.
 * - previousTokenHash + rotatedAt: token ngay trước đó, dùng để
 *     + cho phép nhiều tab refresh đồng thời trong "grace period" ngắn,
 *     + phát hiện token bị đánh cắp (dùng lại token cũ sau grace period => thu hồi session).
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, private: true },
    previousTokenHash: { type: String, index: true, private: true },
    rotatedAt: { type: Date },
    method: { type: String, required: true }, // password | magic_link | oauth:google | ...
    userAgent: { type: String, maxlength: 500 },
    ip: { type: String },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String },
  },
  { timestamps: true, versionKey: false },
);

// TTL index: MongoDB tự xoá session khi quá expiresAt
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.plugin(toJSONPlugin);

export const Session = mongoose.models.Session ?? mongoose.model('Session', sessionSchema);
