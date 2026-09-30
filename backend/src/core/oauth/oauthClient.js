// OAuth 2.0 Authorization Code flow (+ PKCE) viết bằng fetch native, không phụ thuộc passport.
import { createHash } from 'node:crypto';
import { API_PREFIX } from '#config/constants.js';
import { env } from '#config/env.js';
import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { generateToken } from '#core/security/token.js';
import { buildUrl } from '#core/utils/url.js';
import { OAUTH_PROVIDER_NAMES, OAUTH_PROVIDERS } from './providers.js';

const REQUEST_TIMEOUT_MS = 10_000;

const isConfigured = (name) => {
  const { clientId, clientSecret } = OAUTH_PROVIDERS[name].credentials();
  return Boolean(clientId && clientSecret);
};

/** Provider đã cấu hình đủ client id/secret trong env. */
export function getEnabledProviders() {
  return OAUTH_PROVIDER_NAMES.filter(isConfigured);
}

/** Lấy config provider, ném lỗi nếu không tồn tại hoặc chưa bật. */
export function getProvider(name) {
  if (!Object.hasOwn(OAUTH_PROVIDERS, name) || !isConfigured(name)) {
    throw AppError.badRequest(
      `Đăng nhập bằng "${name}" chưa được bật`,
      undefined,
      ErrorCodes.OAUTH_PROVIDER_DISABLED,
    );
  }
  return OAUTH_PROVIDERS[name];
}

/** URL callback đăng ký trên Google/GitHub console phải trùng CHÍNH XÁC giá trị này. */
export function getRedirectUri(name) {
  return buildUrl(env.API_PUBLIC_URL, `${API_PREFIX}/auth/oauth/${name}/callback`);
}

/** Cặp PKCE: verifier (giữ bí mật ở server) + challenge (gửi lên provider). */
export function createPkcePair() {
  const codeVerifier = generateToken(32);
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function buildAuthorizationUrl(name, { state, codeChallenge }) {
  const provider = getProvider(name);
  const { clientId } = provider.credentials();
  return buildUrl(provider.authorizeUrl, '', {
    client_id: clientId,
    redirect_uri: getRedirectUri(name),
    response_type: 'code',
    scope: provider.scopes.join(' '),
    state,
    ...(provider.pkce && { code_challenge: codeChallenge, code_challenge_method: 'S256' }),
    ...provider.authParams,
  });
}

async function requestJson(url, init) {
  let response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (cause) {
    throw new AppError('Không kết nối được tới nhà cung cấp OAuth', {
      statusCode: 502,
      code: ErrorCodes.OAUTH_FAILED,
      cause,
    });
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    throw new AppError('Xác thực với nhà cung cấp OAuth thất bại', {
      statusCode: 502,
      code: ErrorCodes.OAUTH_FAILED,
      details: { status: response.status, error: body.error },
    });
  }
  return body;
}

const getJson = (url, accessToken) =>
  requestJson(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': env.APP_NAME,
    },
  });

/** Đổi authorization code lấy access token của provider. */
export async function exchangeCode(name, { code, codeVerifier }) {
  const provider = getProvider(name);
  const { clientId, clientSecret } = provider.credentials();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(name),
    client_id: clientId,
    client_secret: clientSecret,
    ...(provider.pkce && codeVerifier && { code_verifier: codeVerifier }),
  });
  const data = await requestJson(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  if (!data.access_token) {
    throw new AppError('Provider không trả về access token', {
      statusCode: 502,
      code: ErrorCodes.OAUTH_FAILED,
    });
  }
  return data.access_token;
}

/** Lấy profile đã chuẩn hoá từ provider. */
export async function fetchProfile(name, accessToken) {
  return getProvider(name).fetchProfile(accessToken, getJson);
}
