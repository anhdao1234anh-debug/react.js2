import { useEffect, useState } from 'react';
import { Input, Select } from '@/core/components/ui';
import { ROLE_LABELS } from '@/core/constants/rbac';
import { useDebounce } from '@/core/hooks/useDebounce';

export function UserFilters({ params, onChange }) {
  const [search, setSearch] = useState(params.search ?? '');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if ((params.search ?? '') !== debouncedSearch) onChange({ search: debouncedSearch });
  }, [debouncedSearch, params.search, onChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="search"
        placeholder="Tìm theo tên hoặc email..."
        aria-label="Tìm người dùng"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        aria-label="Lọc theo quyền"
        value={params.role ?? ''}
        onChange={(event) => onChange({ role: event.target.value })}
        className="sm:w-48"
      >
        <option value="">Tất cả quyền</option>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <option key={role} value={role}>
            {label}
          </option>
        ))}
      </Select>
    </div>
  );
}
