import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { isProduction } from '#config/env.js';
import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { logger } from '#core/logger/logger.js';
import { formatZodIssues } from './validate.js';

/**
 * Chuẩn hoá mọi loại lỗi (Zod, Mongoose, Mongo, JWT, body-parser...) thành AppError.
 * @param {unknown} error
 * @returns {AppError}
 */
export function normalizeError(error) {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return AppError.validation(formatZodIssues(error.issues, 'body'));
  }

  if (error instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Giá trị không hợp lệ cho trường "${error.path}"`);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({
      location: 'body',
      path: item.path,
      message: item.message,
      code: item.kind,
    }));
    return AppError.validation(details);
  }

  // Trùng unique index (E11000)
  if (error?.code === 11000) {
    const fields = Object.keys(error.keyValue ?? error.keyPattern ?? {});
    return AppError.conflict(`Giá trị đã tồn tại: ${fields.join(', ') || 'unknown'}`, { fields });
  }

  if (error instanceof jwt.TokenExpiredError) {
    return AppError.unauthorized('Phiên truy cập đã hết hạn', ErrorCodes.TOKEN_EXPIRED);
  }
  if (error instanceof jwt.JsonWebTokenError) {
    return AppError.unauthorized('Token không hợp lệ', ErrorCodes.INVALID_TOKEN);
  }

  // Lỗi từ body-parser (express.json)
  if (error?.type === 'entity.parse.failed') {
    return AppError.badRequest('Body JSON không hợp lệ', undefined, ErrorCodes.INVALID_JSON);
  }
  if (error?.type === 'entity.too.large') {
    return new AppError('Dữ liệu gửi lên quá lớn', {
      statusCode: 413,
      code: ErrorCodes.PAYLOAD_TOO_LARGE,
    });
  }

  return AppError.internal(undefined, error);
}

/**
 * Error-handling middleware cuối cùng (4 tham số).
 * - Lỗi 5xx: log đầy đủ + ẩn chi tiết ở production.
 * - Lỗi 4xx: trả message/code/details cho client.
 */
export function errorHandler(error, req, res, _next) {
  const appError = normalizeError(error);
  const { statusCode, code, message, details } = appError;

  if (statusCode >= 500) {
    (req.log ?? logger).error({ err: error, requestId: req.id }, 'Unhandled error');
  }

  const body = {
    success: false,
    error: { code, message, ...(details !== undefined && { details }) },
    requestId: req.id,
  };

  if (!isProduction && statusCode >= 500) {
    body.error.debug = { name: error?.name, message: error?.message, stack: error?.stack };
  }

  if (res.headersSent) return;
  res.status(statusCode).json(body);
}
