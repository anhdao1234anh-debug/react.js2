import { randomUUID } from 'node:crypto';

const HEADER = 'X-Request-Id';
const VALID_ID = /^[\w.-]{1,128}$/;

/**
 * Gắn mã định danh cho mỗi request (req.id) và trả lại qua header X-Request-Id.
 * Giúp truy vết log & báo lỗi (client gửi kèm requestId khi báo bug).
 */
export function requestId(req, res, next) {
  const incoming = req.get(HEADER);
  req.id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
  res.set(HEADER, req.id);
  next();
}
