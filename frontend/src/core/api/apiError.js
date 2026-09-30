import axios from 'axios';

const STATUS_MESSAGES = {
  400: 'Yêu cầu không hợp lệ',
  401: 'Bạn cần đăng nhập để tiếp tục',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu',
  409: 'Dữ liệu bị trùng lặp',
  422: 'Dữ liệu không hợp lệ',
  429: 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
  500: 'Máy chủ gặp sự cố, vui lòng thử lại sau',
};

/**
 * Lỗi API đã chuẩn hoá. UI chỉ làm việc với ApiError, không đụng tới cấu trúc lỗi của axios.
 * - status: HTTP status (0 = lỗi mạng)
 * - code  : mã lỗi từ backend (VALIDATION_ERROR, INVALID_CREDENTIALS...)
 * - details: danh sách lỗi theo field (với 422)
 */
export class ApiError extends Error {
  constructor({ message, status = 0, code = 'UNKNOWN_ERROR', details, requestId }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

/** Chuyển mọi loại lỗi (axios, network, timeout...) thành ApiError. */
export function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError({ message: 'Yêu cầu đã bị huỷ', code: 'CANCELED' });
  }

  const response = error?.response;
  if (response) {
    const body = response.data?.error ?? {};
    return new ApiError({
      message: body.message ?? STATUS_MESSAGES[response.status] ?? 'Đã có lỗi xảy ra',
      status: response.status,
      code: body.code ?? 'HTTP_ERROR',
      details: body.details,
      requestId: response.data?.requestId,
    });
  }

  if (error?.code === 'ECONNABORTED') {
    return new ApiError({ message: 'Máy chủ phản hồi quá lâu, vui lòng thử lại', code: 'TIMEOUT' });
  }

  return new ApiError({
    message: 'Không thể kết nối tới máy chủ. Kiểm tra mạng hoặc thử lại sau.',
    code: 'NETWORK_ERROR',
  });
}

/** Lấy message hiển thị được từ lỗi bất kỳ. */
export function getErrorMessage(error, fallback = 'Đã có lỗi xảy ra') {
  if (!error) return fallback;
  return error.message || fallback;
}
