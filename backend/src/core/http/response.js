// Chuẩn hoá cấu trúc response thành công:
// { success: true, message?, data, meta? }
// (Response lỗi do errorHandler tạo: { success: false, error: { code, message, details? }, requestId })

/**
 * @param {import('express').Response} res
 * @param {{ data?: unknown, message?: string, meta?: object, statusCode?: number }} [payload]
 */
export function sendSuccess(res, { data = null, message, meta, statusCode = 200 } = {}) {
  return res.status(statusCode).json({ success: true, message, data, meta });
}

export function sendCreated(res, data, message = 'Tạo mới thành công') {
  return sendSuccess(res, { data, message, statusCode: 201 });
}

/** Response danh sách có phân trang: data = items, meta = thông tin trang. */
export function sendPaginated(res, { items, meta }, message) {
  return sendSuccess(res, { data: items, meta, message });
}

export function sendNoContent(res) {
  return res.status(204).end();
}
