import { Button } from './Button';

/** Điều hướng trang dựa trên `meta` phân trang từ API. */
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total } = meta;

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-4 pt-4">
      <p className="text-sm text-gray-600">
        Trang <span className="font-medium">{page}</span> / {totalPages} · {total} kết quả
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
