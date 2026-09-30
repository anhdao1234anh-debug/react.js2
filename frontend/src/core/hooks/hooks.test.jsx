import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHookWithProviders } from '@/test/render';
import { useDebounce } from './useDebounce';
import { useDisclosure } from './useDisclosure';
import { useListParams } from './useListParams';
import { useRunOnce } from './useRunOnce';

describe('useDebounce', () => {
  it('chỉ cập nhật sau khoảng delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'ab' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('ab');
    vi.useRealTimers();
  });
});

describe('useDisclosure', () => {
  it('open kèm data, close xoá data, toggle', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.open({ id: 1 }));
    expect(result.current).toMatchObject({ isOpen: true, data: { id: 1 } });
    act(() => result.current.close());
    expect(result.current).toMatchObject({ isOpen: false, data: null });
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
  });
});

describe('useRunOnce', () => {
  it('chỉ chạy 1 lần kể cả dưới StrictMode', () => {
    const callback = vi.fn();
    renderHook(() => useRunOnce(callback), { wrapper: StrictMode });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('useListParams', () => {
  it('đọc tham số từ URL, áp dụng mặc định', () => {
    const { result } = renderHookWithProviders(
      () => useListParams({ defaults: { limit: 10, sort: '-createdAt' }, filters: ['role'] }),
      { route: '/users?page=2&search=an&role=admin' },
    );
    expect(result.current.params).toEqual({
      page: 2,
      limit: 10,
      search: 'an',
      sort: '-createdAt',
      role: 'admin',
    });
  });

  it('đổi bộ lọc thì về trang 1, xoá tham số rỗng', () => {
    const { result } = renderHookWithProviders(() => useListParams({ filters: ['role'] }), {
      route: '/users?page=3&role=admin',
    });
    act(() => result.current.setParams({ role: '', search: 'bình' }));
    expect(result.current.params).toMatchObject({ page: 1, search: 'bình', role: undefined });

    act(() => result.current.setPage(4));
    expect(result.current.params.page).toBe(4);
  });
});
