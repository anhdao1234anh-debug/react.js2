import mongoose from 'mongoose';

export const AUTH_TOKEN_TYPES = Object.freeze({
  MAGIC_LINK: 'magic_link',
  EMAIL_VERIFY: 'email_verify',
  PASSWORD_RESET: 'password_reset',
});

/**
 * Token dùng MỘT LẦN gửi qua email (magic link, xác thực email, đặt lại mật khẩu).
 * Chỉ lưu hash; token gốc chỉ nằm trong email.
 */
const authTokenSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(AUTH_TOKEN_TYPES), required: true },
    tokenHash: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    // Magic link cho email chưa có tài khoản => user = null, tạo tài khoản khi xác thực
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false },
);

// Giữ token hết hạn thêm 1 ngày (để debug/audit) rồi MongoDB tự xoá
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const AuthToken = mongoose.models.AuthToken ?? mongoose.model('AuthToken', authTokenSchema);
