import { Router } from 'express';
import { authRateLimiter } from '#core/middlewares/rateLimiter.js';
import { validate } from '#core/middlewares/validate.js';
import { authController } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';
import {
  changePasswordSchema,
  emailBodySchema,
  loginSchema,
  magicLinkRequestSchema,
  oauthCallbackSchema,
  oauthStartSchema,
  registerSchema,
  resetPasswordSchema,
  sessionIdSchema,
  tokenBodySchema,
} from './auth.schema.js';

const router = Router();

router.get('/providers', authController.providers);

// ----- 1. Email + mật khẩu -----
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post(
  '/email/verify',
  authRateLimiter,
  validate(tokenBodySchema),
  authController.verifyEmail,
);
router.post('/email/resend', authenticate, authRateLimiter, authController.resendVerification);
router.post(
  '/password/forgot',
  authRateLimiter,
  validate(emailBodySchema),
  authController.forgotPassword,
);
router.post(
  '/password/reset',
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.patch(
  '/password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

// ----- 2. Magic link -----
router.post(
  '/magic-link',
  authRateLimiter,
  validate(magicLinkRequestSchema),
  authController.requestMagicLink,
);
router.post(
  '/magic-link/verify',
  authRateLimiter,
  validate(tokenBodySchema),
  authController.verifyMagicLink,
);

// ----- 3. OAuth -----
router.get('/oauth/:provider', validate(oauthStartSchema), authController.oauthStart);
router.get(
  '/oauth/:provider/callback',
  validate(oauthCallbackSchema),
  authController.oauthCallback,
);

// ----- Phiên đăng nhập -----
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);
router.get('/sessions', authenticate, authController.listSessions);
router.delete(
  '/sessions/:id',
  authenticate,
  validate(sessionIdSchema),
  authController.revokeSession,
);

export default router;
