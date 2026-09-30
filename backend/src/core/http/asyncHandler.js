/**
 * Bọc handler async: mọi lỗi (throw / reject) được chuyển tới errorHandler qua next(err).
 * Express 5 đã tự bắt promise bị reject, nhưng vẫn dùng asyncHandler để:
 *  - thống nhất cách viết controller/middleware,
 *  - đảm bảo cả lỗi đồng bộ lẫn bất đồng bộ đều đi qua next().
 *
 * @template {import('express').RequestHandler} T
 * @param {T} handler
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (handler) =>
  function asyncHandlerWrapper(req, res, next) {
    try {
      return Promise.resolve(handler(req, res, next)).catch(next);
    } catch (error) {
      return next(error);
    }
  };

/**
 * Bọc toàn bộ method của một controller object bằng asyncHandler.
 * @example export const productController = asyncHandlers({ list, getById });
 */
export const asyncHandlers = (handlers) =>
  Object.fromEntries(Object.entries(handlers).map(([name, fn]) => [name, asyncHandler(fn)]));
