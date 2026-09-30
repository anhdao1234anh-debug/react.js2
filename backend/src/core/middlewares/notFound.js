import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';

/** Bắt mọi request không khớp route nào -> 404 chuẩn hoá. */
export function notFound(req, _res, next) {
  next(
    new AppError(`Không tìm thấy route ${req.method} ${req.originalUrl}`, {
      statusCode: 404,
      code: ErrorCodes.ROUTE_NOT_FOUND,
    }),
  );
}
