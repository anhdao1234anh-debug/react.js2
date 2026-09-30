import { AppError } from '#core/errors/AppError.js';

const LOCATIONS = /** @type {const} */ (['params', 'query', 'body']);

/** Chuyển Zod issues -> danh sách lỗi gọn cho client. */
export function formatZodIssues(issues, location) {
  return issues.map((issue) => ({
    location,
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Middleware validate request bằng Zod.
 * - Dữ liệu sau parse (đã coerce/trim/default) được ghi đè lại vào req.body/req.query/req.params.
 * - Đồng thời lưu ở req.validated để controller dùng tường minh.
 * - Gom lỗi của cả 3 vị trí rồi trả 422 một lần.
 *
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 */
export function validate(schemas) {
  return async function validateMiddleware(req, _res, next) {
    const errors = [];
    req.validated ??= {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = await schema.safeParseAsync(req[location] ?? {});
      if (!result.success) {
        errors.push(...formatZodIssues(result.error.issues, location));
        continue;
      }

      req.validated[location] = result.data;
      if (location === 'query') {
        // Express 5: req.query là getter chỉ đọc -> định nghĩa lại thuộc tính trên instance
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } else {
        req[location] = result.data;
      }
    }

    if (errors.length > 0) return next(AppError.validation(errors));
    return next();
  };
}
