import { useEffect, useState } from 'react';

/** Trả về giá trị chỉ cập nhật sau khi `value` ngừng thay đổi `delay` ms (vd ô tìm kiếm). */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
