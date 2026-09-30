import { useEffect, useState } from 'react';
import { Input, Select } from '@/core/components/ui';
import { useDebounce } from '@/core/hooks/useDebounce';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Mới nhất' },
  { value: 'price', label: 'Giá tăng dần' },
  { value: '-price', label: 'Giá giảm dần' },
  { value: 'title', label: 'Tên A → Z' },
];

/** Ô tìm kiếm (debounce) + chọn sắp xếp. Giá trị đồng bộ với URL qua useListParams. */
export function ProductFilters({ params, onChange }) {
  const [search, setSearch] = useState(params.search ?? '');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if ((params.search ?? '') !== debouncedSearch) onChange({ search: debouncedSearch });
  }, [debouncedSearch, params.search, onChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="search"
        placeholder="Tìm sản phẩm..."
        aria-label="Tìm sản phẩm"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        aria-label="Sắp xếp"
        value={params.sort ?? '-createdAt'}
        onChange={(event) => onChange({ sort: event.target.value })}
        className="sm:w-48"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
