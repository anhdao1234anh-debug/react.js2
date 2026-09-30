import { useEffect, useRef } from 'react';

/**
 * Chạy callback đúng 1 lần khi mount - kể cả dưới React StrictMode (effect bị gọi 2 lần ở dev).
 * Dùng cho thao tác KHÔNG được lặp lại: tiêu thụ token magic link, xác thực email...
 */
export function useRunOnce(callback) {
  const hasRun = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    callbackRef.current();
  }, []);
}
