// Nội dung email của module auth. Link luôn trỏ về FRONTEND (FE gọi API xác thực token).
import { FRONTEND_PATHS } from '#config/constants.js';
import { env } from '#config/env.js';
import { renderActionEmail } from '#core/mail/layout.js';
import { buildUrl } from '#core/utils/url.js';

const frontendLink = (path, token) => buildUrl(env.FRONTEND_URL, path, { token });

export function magicLinkEmail({ token, isNewUser }) {
  return {
    subject: `Liên kết đăng nhập ${env.APP_NAME}`,
    ...renderActionEmail({
      title: isNewUser ? 'Chào mừng bạn!' : 'Đăng nhập không cần mật khẩu',
      intro: isNewUser
        ? 'Nhấn nút bên dưới để tạo tài khoản và đăng nhập.'
        : 'Nhấn nút bên dưới để đăng nhập.',
      actionText: 'Đăng nhập',
      actionUrl: frontendLink(FRONTEND_PATHS.MAGIC_LINK_VERIFY, token),
      outro: `Liên kết hết hạn sau ${env.MAGIC_LINK_EXPIRES_IN} và chỉ dùng được một lần. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`,
    }),
  };
}

export function verifyEmailEmail({ token, name }) {
  return {
    subject: `Xác thực email - ${env.APP_NAME}`,
    ...renderActionEmail({
      title: `Xin chào ${name}`,
      intro: 'Vui lòng xác thực địa chỉ email của bạn.',
      actionText: 'Xác thực email',
      actionUrl: frontendLink(FRONTEND_PATHS.VERIFY_EMAIL, token),
      outro: `Liên kết hết hạn sau ${env.EMAIL_VERIFY_EXPIRES_IN}.`,
    }),
  };
}

export function resetPasswordEmail({ token, name }) {
  return {
    subject: `Đặt lại mật khẩu - ${env.APP_NAME}`,
    ...renderActionEmail({
      title: `Xin chào ${name}`,
      intro: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
      actionText: 'Đặt lại mật khẩu',
      actionUrl: frontendLink(FRONTEND_PATHS.RESET_PASSWORD, token),
      outro: `Liên kết hết hạn sau ${env.PASSWORD_RESET_EXPIRES_IN}. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`,
    }),
  };
}
