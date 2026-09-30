// Mail service tối giản với cơ chế "driver" để dễ mở rộng.
//  - console: in email ra log (development)
//  - memory : lưu vào outbox trong RAM (test - đọc link magic/reset từ đây)
// Phase Mail (xem docs/10-roadmap.md): thêm driver smtp/resend, template engine, hàng đợi gửi lại.
import { env } from '#config/env.js';
import { createLogger } from '#core/logger/logger.js';

const log = createLogger('mail');

/** @typedef {{ to: string, subject: string, html: string, text?: string }} MailMessage */

/** Outbox của driver memory (chỉ dùng trong test). */
export const mailOutbox = [];

export function clearMailOutbox() {
  mailOutbox.length = 0;
}

const drivers = {
  /** @param {MailMessage & { from: string }} message */
  async console(message) {
    log.info(
      { to: message.to, subject: message.subject },
      `\n📧 [MAIL] To: ${message.to}\nSubject: ${message.subject}\n${message.text ?? message.html}\n`,
    );
  },
  /** @param {MailMessage & { from: string }} message */
  async memory(message) {
    mailOutbox.push({ ...message, sentAt: new Date() });
  },
};

/**
 * Gửi email qua driver cấu hình ở MAIL_DRIVER.
 * @param {MailMessage} message
 */
export async function sendMail(message) {
  const driver = drivers[env.MAIL_DRIVER];
  if (!driver) throw new Error(`MAIL_DRIVER không hỗ trợ: ${env.MAIL_DRIVER}`);
  await driver({ from: env.MAIL_FROM, ...message });
}
