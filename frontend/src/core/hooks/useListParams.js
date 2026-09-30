import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Đồng bộ tham số danh sách (page, limit, search, sort, filter...) với URL query string
 * => F5 / chia sẻ link vẫn giữ nguyên trang & bộ lọc.
 *
 * @param {{ defaults?: Record<string, string | number>, filters?: string[] }} [options]
 * @example const { params, setParams, setPage } = useListParams({ defaults: { limit: 12 }, filters: ['role'] })
 */
export function useListParams({ defaults = {}, filters = [] } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterKey = filters.join(',');
  const defaultsKey = JSON.stringify(defaults);

  const params = useMemo(() => {
    const base = JSON.parse(defaultsKey);
    const result = {
      page: Number(searchParams.get('page')) || base.page || 1,
      limit: Number(searchParams.get('limit')) || base.limit || 20,
      search: searchParams.get('search') || base.search || undefined,
      sort: searchParams.get('sort') || base.sort || undefined,
    };
    for (const key of filterKey ? filterKey.split(',') : []) {
      result[key] = searchParams.get(key) || base[key] || undefined;
    }
    return result;
  }, [searchParams, defaultsKey, filterKey]);

  /** Cập nhật một phần tham số. Đổi bộ lọc (không phải page) => quay về trang 1. */
  const setParams = useCallback(
    (patch) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === null || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback((page) => setParams({ page }), [setParams]);

  return { params, setParams, setPage };
}
