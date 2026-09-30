// Cấu hình các OAuth 2.0 provider. Thêm provider mới (Facebook, Microsoft...) = thêm 1 entry
// với authorizeUrl/tokenUrl/scopes + hàm fetchProfile trả về profile đã chuẩn hoá.
import { env } from '#config/env.js';

/**
 * @typedef {object} OAuthProfile  Profile đã chuẩn hoá, độc lập provider
 * @property {string} providerId
 * @property {string | undefined} email
 * @property {boolean} emailVerified
 * @property {string | undefined} name
 * @property {string | undefined} avatarUrl
 */

/**
 * @typedef {object} OAuthProviderConfig
 * @property {string} authorizeUrl
 * @property {string} tokenUrl
 * @property {string[]} scopes
 * @property {boolean} pkce  Hỗ trợ PKCE (Proof Key for Code Exchange)
 * @property {Record<string, string>} [authParams]
 * @property {() => { clientId?: string, clientSecret?: string }} credentials
 * @property {(accessToken: string, getJson: (url: string, token: string) => Promise<any>) => Promise<OAuthProfile>} fetchProfile
 */

/** @type {Record<string, OAuthProviderConfig>} */
export const OAUTH_PROVIDERS = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['openid', 'email', 'profile'],
    pkce: true,
    authParams: { prompt: 'select_account' },
    credentials: () => ({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    async fetchProfile(accessToken, getJson) {
      const data = await getJson('https://openidconnect.googleapis.com/v1/userinfo', accessToken);
      return {
        providerId: String(data.sub),
        email: data.email?.toLowerCase(),
        emailVerified: data.email_verified === true,
        name: data.name,
        avatarUrl: data.picture,
      };
    },
  },

  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'user:email'],
    pkce: false,
    credentials: () => ({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    async fetchProfile(accessToken, getJson) {
      const user = await getJson('https://api.github.com/user', accessToken);
      // Email public có thể null -> lấy email primary đã verify từ /user/emails
      const emails = await getJson('https://api.github.com/user/emails', accessToken).catch(
        () => [],
      );
      const primary = Array.isArray(emails)
        ? emails.find((item) => item.primary && item.verified)
        : undefined;
      return {
        providerId: String(user.id),
        email: (primary?.email ?? user.email)?.toLowerCase(),
        emailVerified: Boolean(primary?.verified),
        name: user.name ?? user.login,
        avatarUrl: user.avatar_url,
      };
    },
  },
};

export const OAUTH_PROVIDER_NAMES = Object.freeze(Object.keys(OAUTH_PROVIDERS));
