// Phương thức 3: OAuth 2.0 (Google, GitHub...). Luồng giao thức nằm ở core/oauth,
// service này lo phần nghiệp vụ: kiểm tra state, tìm/tạo/liên kết user, tạo session.
import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import {
  buildAuthorizationUrl,
  createPkcePair,
  exchangeCode,
  fetchProfile,
  getEnabledProviders,
  getProvider,
} from '#core/oauth/oauthClient.js';
import { generateToken, safeEqual } from '#core/security/token.js';
import { nameFromEmail } from '#core/utils/string.js';
import { sanitizeRedirectPath } from '#core/utils/url.js';
import { userRepository } from '#modules/user/user.repository.js';
import { sessionService } from './session.service.js';

function parseStoredState(raw) {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Tìm user theo tài khoản OAuth -> theo email (chỉ liên kết khi provider xác nhận email) -> tạo mới.
 * @param {string} provider
 * @param {import('#core/oauth/providers.js').OAuthProfile} profile
 */
async function findOrCreateUser(provider, profile) {
  let user = await userRepository.findByOAuthAccount(provider, profile.providerId);

  if (!user) {
    if (!profile.email) {
      throw AppError.badRequest(
        'Tài khoản mạng xã hội không cung cấp email',
        undefined,
        ErrorCodes.OAUTH_EMAIL_REQUIRED,
      );
    }
    const existing = await userRepository.findByEmail(profile.email);
    if (existing) {
      // Không liên kết nếu provider chưa xác nhận email -> chống chiếm tài khoản
      if (!profile.emailVerified) {
        throw AppError.conflict(
          'Email đã được đăng ký bằng phương thức khác. Vui lòng đăng nhập bằng phương thức đó.',
        );
      }
      existing.oauthAccounts.push({ provider, providerId: profile.providerId });
      user = existing;
    } else {
      user = await userRepository.create({
        name: profile.name?.trim() || nameFromEmail(profile.email),
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        emailVerifiedAt: profile.emailVerified ? new Date() : null,
        oauthAccounts: [{ provider, providerId: profile.providerId }],
      });
    }
  }

  if (!user.isActive) throw AppError.forbidden('Tài khoản đã bị khoá', ErrorCodes.ACCOUNT_DISABLED);
  if (profile.emailVerified && user.email === profile.email) user.emailVerifiedAt ??= new Date();
  if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
  return user;
}

export const oauthService = {
  getEnabledProviders,

  /**
   * Bắt đầu OAuth: tạo state (chống CSRF) + PKCE, trả URL chuyển hướng tới provider
   * và giá trị cần lưu vào cookie ký (signed cookie).
   */
  start(provider, { redirectTo } = {}) {
    getProvider(provider);
    const state = generateToken(24);
    const { codeVerifier, codeChallenge } = createPkcePair();
    return {
      url: buildAuthorizationUrl(provider, { state, codeChallenge }),
      cookieValue: JSON.stringify({
        provider,
        state,
        codeVerifier,
        redirectTo: sanitizeRedirectPath(redirectTo, null),
      }),
    };
  },

  /** Xử lý callback: xác minh state -> đổi code -> lấy profile -> đăng nhập. */
  async handleCallback(provider, { code, state, storedState }, context) {
    const stored = parseStoredState(storedState);
    if (!stored || stored.provider !== provider || !state || !safeEqual(stored.state, state)) {
      throw AppError.badRequest(
        'Phiên OAuth không hợp lệ, vui lòng thử lại',
        undefined,
        ErrorCodes.OAUTH_STATE_MISMATCH,
      );
    }
    if (!code)
      throw AppError.badRequest('Thiếu authorization code', undefined, ErrorCodes.OAUTH_FAILED);

    const accessToken = await exchangeCode(provider, { code, codeVerifier: stored.codeVerifier });
    const profile = await fetchProfile(provider, accessToken);
    const user = await findOrCreateUser(provider, profile);
    const session = await sessionService.signIn(user, { method: `oauth:${provider}`, ...context });
    return { ...session, redirectTo: stored.redirectTo };
  },
};
