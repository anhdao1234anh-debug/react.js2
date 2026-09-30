import { ErrorCodes } from './errorCodes.js';

/**
 * Lỗi nghiệp vụ "có kiểm soát" (operational error).
 * Throw ở service/controller -> errorHandler chuyển thành JSON response chuẩn.
 *
 * @example throw AppError.notFound('Sản phẩm');
 * @example throw new AppError('Hết hàng', { statusCode: 409, code: 'OUT_OF_STOCK' });
 */
export class AppError extends Error {
  /**
   * @param {string} message Thông điệp hiển thị cho client
   * @param {{ statusCode?: number, code?: string, details?: unknown, cause?: unknown }} [options]
   */
  constructor(
    message,
    { statusCode = 500, code = ErrorCodes.INTERNAL_ERROR, details, cause } = {},
  ) {
    super(message, { cause });
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message = 'Yêu cầu không hợp lệ', details, code = ErrorCodes.BAD_REQUEST) {
    return new AppError(message, { statusCode: 400, code, details });
  }

  static validation(details, message = 'Dữ liệu không hợp lệ') {
    return new AppError(message, { statusCode: 422, code: ErrorCodes.VALIDATION_ERROR, details });
  }

  static unauthorized(message = 'Bạn cần đăng nhập để tiếp tục', code = ErrorCodes.UNAUTHORIZED) {
    return new AppError(message, { statusCode: 401, code });
  }

  static forbidden(
    message = 'Bạn không có quyền thực hiện thao tác này',
    code = ErrorCodes.FORBIDDEN,
  ) {
    return new AppError(message, { statusCode: 403, code });
  }

  static notFound(resource = 'Tài nguyên') {
    return new AppError(`${resource} không tồn tại`, {
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  static conflict(message = 'Dữ liệu bị trùng lặp', details) {
    return new AppError(message, { statusCode: 409, code: ErrorCodes.CONFLICT, details });
  }

  static tooManyRequests(message = 'Bạn thao tác quá nhanh, vui lòng thử lại sau') {
    return new AppError(message, { statusCode: 429, code: ErrorCodes.TOO_MANY_REQUESTS });
  }

  static internal(message = 'Đã có lỗi xảy ra, vui lòng thử lại sau', cause) {
    return new AppError(message, { statusCode: 500, code: ErrorCodes.INTERNAL_ERROR, cause });
  }
}
