import { env } from '#config/env.js';

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Khung HTML email đơn giản có nút hành động.
 * @param {{ title: string, intro: string, actionText?: string, actionUrl?: string, outro?: string }} content
 * @returns {{ html: string, text: string }}
 */
export function renderActionEmail({ title, intro, actionText, actionUrl, outro }) {
  const button = actionUrl
    ? `<p style="margin:24px 0"><a href="${escapeHtml(actionUrl)}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${escapeHtml(actionText ?? 'Mở liên kết')}</a></p>
       <p style="font-size:12px;color:#6b7280">Nếu nút không hoạt động, copy link: ${escapeHtml(actionUrl)}</p>`
    : '';

  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:24px">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:32px">
    <h2 style="margin-top:0">${escapeHtml(title)}</h2>
    <p>${escapeHtml(intro)}</p>
    ${button}
    ${outro ? `<p style="color:#6b7280">${escapeHtml(outro)}</p>` : ''}
    <hr style="border:none;border-top:1px solid #e5e7eb"/>
    <p style="font-size:12px;color:#9ca3af">${escapeHtml(env.APP_NAME)}</p>
  </div></body></html>`;

  const text = [title, '', intro, actionUrl ? `\n${actionText}: ${actionUrl}` : '', outro ?? '']
    .filter((line) => line !== undefined)
    .join('\n');

  return { html, text };
}
