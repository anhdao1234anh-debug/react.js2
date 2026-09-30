/**
 * Gắn lỗi validate từ server (422 VALIDATION_ERROR / details có path) vào đúng field của react-hook-form.
 * @param {import('react-hook-form').UseFormSetError<any>} setError
 * @param {import('@/core/api/apiError').ApiError} error
 * @param {string[]} [fieldNames] các field có trên form (field lạ sẽ không được gắn)
 * @returns {boolean} true nếu còn lỗi CHƯA gắn được vào field nào (cần hiển thị lỗi chung)
 */
export function applyServerErrors(setError, error, fieldNames) {
  const details = Array.isArray(error?.details) ? error.details : [];
  if (details.length === 0) return true;

  let hasUnmapped = false;
  for (const detail of details) {
    const field = detail?.path;
    if (field && (!fieldNames || fieldNames.includes(field))) {
      setError(field, { type: 'server', message: detail.message });
    } else {
      hasUnmapped = true;
    }
  }
  return hasUnmapped;
}

/** Bỏ các field là chuỗi rỗng trước khi gửi API (vd thumbnail không nhập). */
export function stripEmpty(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value !== undefined),
  );
}
