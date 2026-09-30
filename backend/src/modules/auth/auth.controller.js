import { COOKIE_NAMES, FRONTEND_PATHS } from '#config/constants.js';
import { env } from '#config/env.js';
import { asyncHandlers } from '#core/http/asyncHandler.js';
import { sendSuccess } from '#core/http/response.js';
import { normalizeError } from '#core/middlewares/errorHandler.js';
import {
  clearRefreshCookie,
  oauthStateCookieOptions,
  setRefreshCookie,
} from '#core/security/cookies.js';
import { ACCESS_TOKEN_TTL_SECONDS } from '#core/security/jwt.js';
import { buildUrl } from '#core/utils/url.js';
import { userRepository } from '#modules/user/user.repository.js';
import { toAuthUser } from './auth.serializer.js';
import { magicLinkService } from './magicLink.service.js';
import { oauthService } from './oauth.service.js';
import { passwordAuthService } from './password.service.js';
import { sessionService } from './session.service.js';

const GENERIC_EMAIL_SENT = 'Nếu email hợp lệ, chúng tôi đã gửi hướng dẫn vào hộp thư của bạn';

/** Thông tin thiết bị lưu cùng session. */
const requestContext = (req) => ({ userAgent: req.get('user-agent'), ip: req.ip });

/**
 * Trả kết quả đăng nhập: access token trong body, refresh token trong cookie httpOnly.
 * @param {import('express').Response} res
 */
function sendAuthResult(res, { user, accessToken, refreshToken, redirectTo }, statusCode = 200) {
  if (refreshToken) setRefreshCookie(res, refreshToken);
  return sendSuccess(res, {
    statusCode,
    data: { user: toAuthUser(user), accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS, redirectTo },
  });
}

const oauthRedirect = (query) => buildUrl(env.FRONTEND_URL, FRONTEND_PATHS.OAUTH_CALLBACK, query);

export const authController = asyncHandlers({
  async providers(_req, res) {
    sendSuccess(res, {
      data: {
        methods: { password: true, magicLink: true },
        oauth: oauthService.getEnabledProviders(),
      },
    });
  },

  // ----- Email + mật khẩu -----
  async register(req, res) {
    const result = await passwordAuthService.register(req.body, requestContext(req));
    sendAuthResult(res, result, 201);
  },

  async login(req, res) {
    const result = await passwordAuthService.login(req.body, requestContext(req));
    sendAuthResult(res, result);
  },

  async verifyEmail(req, res) {
    await passwordAuthService.verifyEmail(req.body.token);
    sendSuccess(res, { message: 'Xác thực email thành công' });
  },

  async resendVerification(req, res) {
    await passwordAuthService.resendVerification(req.user);
    sendSuccess(res, { message: 'Đã gửi lại email xác thực' });
  },

  async forgotPassword(req, res) {
    await passwordAuthService.forgotPassword(req.body.email);
    sendSuccess(res, { message: GENERIC_EMAIL_SENT });
  },

  async resetPassword(req, res) {
    await passwordAuthService.resetPassword(req.body);
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại' });
  },

  async changePassword(req, res) {
    const user = await passwordAuthService.changePassword(req.user.id, req.body, {
      currentSessionId: req.sessionId,
    });
    sendSuccess(res, { data: toAuthUser(user), message: 'Đổi mật khẩu thành công' });
  },

  // ----- Magic link -----
  async requestMagicLink(req, res) {
    await magicLinkService.request(req.body);
    sendSuccess(res, { message: GENERIC_EMAIL_SENT });
  },

  async verifyMagicLink(req, res) {
    const result = await magicLinkService.verify(req.body.token, requestContext(req));
    sendAuthResult(res, result);
  },

  // ----- OAuth -----
  async oauthStart(req, res) {
    const { url, cookieValue } = oauthService.start(req.params.provider, req.query);
    res.cookie(COOKIE_NAMES.OAUTH_STATE, cookieValue, oauthStateCookieOptions());
    res.redirect(302, url);
  },

  /** Callback luôn redirect về frontend (thành công hoặc lỗi), không trả JSON. */
  async oauthCallback(req, res) {
    const { provider } = req.params;
    const { code, state, error } = req.query;
    const storedState = req.signedCookies?.[COOKIE_NAMES.OAUTH_STATE];
    const { maxAge: _maxAge, ...stateCookieOptions } = oauthStateCookieOptions();
    res.clearCookie(COOKIE_NAMES.OAUTH_STATE, stateCookieOptions);

    if (error) {
      return res.redirect(302, oauthRedirect({ status: 'error', code: 'OAUTH_ACCESS_DENIED' }));
    }

    try {
      const result = await oauthService.handleCallback(
        provider,
        { code, state, storedState },
        requestContext(req),
      );
      setRefreshCookie(res, result.refreshToken);
      return res.redirect(
        302,
        oauthRedirect({ status: 'success', provider, redirectTo: result.redirectTo }),
      );
    } catch (caught) {
      const appError = normalizeError(caught);
      req.log?.warn({ err: caught, provider }, 'OAuth callback failed');
      return res.redirect(302, oauthRedirect({ status: 'error', code: appError.code }));
    }
  },

  // ----- Phiên đăng nhập -----
  async refresh(req, res) {
    try {
      const result = await sessionService.refresh(
        req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN],
        requestContext(req),
      );
      sendAuthResult(res, result);
    } catch (error) {
      clearRefreshCookie(res);
      throw error;
    }
  },

  async logout(req, res) {
    await sessionService.revokeByToken(req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]);
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Đã đăng xuất' });
  },

  async logoutAll(req, res) {
    const count = await sessionService.revokeAllForUser(req.user._id);
    clearRefreshCookie(res);
    sendSuccess(res, { data: { revoked: count }, message: 'Đã đăng xuất khỏi mọi thiết bị' });
  },

  async me(req, res) {
    const user = await userRepository.findByIdWithPassword(req.user.id);
    sendSuccess(res, { data: toAuthUser(user) });
  },

  async listSessions(req, res) {
    const sessions = await sessionService.listActiveSessions(req.user._id);
    sendSuccess(res, {
      data: sessions.map((session) => ({
        ...session.toJSON(),
        isCurrent: session.id === req.sessionId,
      })),
    });
  },

  async revokeSession(req, res) {
    await sessionService.revokeSessionOfUser(req.user._id, req.params.id);
    sendSuccess(res, { message: 'Đã thu hồi phiên đăng nhập' });
  },
});
