import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast, useToasts } from './toast';

afterEach(() => vi.useRealTimers());

describe('toast store', () => {
  it('thêm, tự đóng sau duration và đóng thủ công', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToasts());

    act(() => {
      toast.success('Lưu thành công', 'chi tiết');
      toast.error('Lỗi');
    });
    expect(result.current.map((item) => [item.type, item.title])).toEqual([
      ['success', 'Lưu thành công'],
      ['error', 'Lỗi'],
    ]);

    act(() => toast.dismiss(result.current[1].id));
    expect(result.current).toHaveLength(1);

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current).toHaveLength(0);
  });

  it('duration = 0 thì không tự đóng', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToasts());
    act(() => {
      toast.show({ title: 'Ghim', duration: 0 });
    });
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current).toHaveLength(1);
    act(() => toast.clear());
    expect(result.current).toHaveLength(0);
  });
});
