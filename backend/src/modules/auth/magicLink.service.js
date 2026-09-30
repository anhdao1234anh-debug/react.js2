// Phương thức 2: Magic link - đăng nhập không mật khẩu qua link gửi email.
// Email chưa có tài khoản => tạo tài khoản khi người dùng MỞ link (tránh tạo rác khi gõ nhầm email).
import { env } from '#config/env.js';
import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { sendMail } from '#core/mail/mailer.js';
import { nameFromEmail } from '#core/utils/string.js';
import { sanitizeRedirectPath } from '#core/utils/url.js';
import { userRepository } from '#modules/user/user.repository.js';
import { magicLinkEmail } from './auth.emails.js';
import { AUTH_TOKEN_TYPES } from './authToken.model.js';
import { authTokenService } from './authToken.service.js';
import { sessionService } from './session.service.js';

export const magicLinkService = {
  /** Luôn phản hồi giống nhau với client (không tiết lộ email có tồn tại hay không). */
  async request({ email, redirectTo }) {
    const user = await userRepository.findByEmail(email);
    if (user && !user.isActive) return;

    const token = await authTokenService.issue({
      type: AUTH_TOKEN_TYPES.MAGIC_LINK,
      email,
      userId: user?._id ?? null,
      ttl: env.MAGIC_LINK_EXPIRES_IN,
      meta: { redirectTo: sanitizeRedirectPath(redirectTo, null) },
    });
    await sendMail({ to: email, ...magicLinkEmail({ token, isNewUser: !user }) });
  },

  async verify(token, context) {
    const record = await authTokenService.consume(AUTH_TOKEN_TYPES.MAGIC_LINK, token);

    let user = await userRepository.findByEmail(record.email, { withPassword: true });
    if (!user) {
      user = await userRepository.create({
        name: nameFromEmail(record.email),
        email: record.email,
        emailVerifiedAt: new Date(),
      });
    } else {
      if (!user.isActive) {
        throw AppError.forbidden('Tài khoản đã bị khoá', ErrorCodes.ACCOUNT_DISABLED);
      }
      // Mở được link trong email => email đã được xác thực
      user.emailVerifiedAt ??= new Date();
    }

    const session = await sessionService.signIn(user, { method: 'magic_link', ...context });
    return { ...session, redirectTo: record.meta?.redirectTo };
  },
};
