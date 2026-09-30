import mongoose from 'mongoose';
import { toJSONPlugin } from '#core/database/plugins/toJSON.js';
import { OAUTH_PROVIDER_NAMES } from '#core/oauth/providers.js';
import { DEFAULT_ROLE, ROLE_LIST } from '#core/rbac/roles.js';

const oauthAccountSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: OAUTH_PROVIDER_NAMES, required: true },
    providerId: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Không select mặc định + private => không bao giờ lọt ra response
    passwordHash: { type: String, select: false, private: true },
    role: { type: String, enum: ROLE_LIST, default: DEFAULT_ROLE, index: true },
    isActive: { type: Boolean, default: true },
    emailVerifiedAt: { type: Date, default: null },
    avatarUrl: { type: String, trim: true },
    oauthAccounts: { type: [oauthAccountSchema], default: [] },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

// Một tài khoản OAuth (provider + providerId) chỉ gắn với 1 user
userSchema.index(
  { 'oauthAccounts.provider': 1, 'oauthAccounts.providerId': 1 },
  { unique: true, partialFilterExpression: { 'oauthAccounts.providerId': { $exists: true } } },
);

userSchema.virtual('isEmailVerified').get(function isEmailVerified() {
  return Boolean(this.emailVerifiedAt);
});

userSchema.plugin(toJSONPlugin);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
