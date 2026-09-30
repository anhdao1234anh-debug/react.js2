import { QueryState } from '@/core/components/feedback/QueryState';
import { EmptyState, Pagination } from '@/core/components/ui';
import { useListParams } from '@/core/hooks/useListParams';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters } from '../components/ProductFilters';
import { useProducts } from '../hooks/useProducts';

/** Trang public: danh sách sản phẩm dạng lưới + tìm kiếm + sắp xếp + phân trang. */
export default function ProductListPage() {
  const { params, setParams, setPage } = useListParams({
    defaults: { limit: 12, sort: '-createdAt' },
  });
  const productsQuery = useProducts(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-600">Khám phá các sản phẩm mới nhất.</p>
        </div>
        <ProductFilters params={params} onChange={setParams} />
      </div>

      <QueryState query={productsQuery} loadingLabel="Đang tải sản phẩm...">
        {({ items, meta }) =>
          items.length === 0 ? (
            <EmptyState
              title="Không có sản phẩm nào"
              description={
                params.search ? `Không tìm thấy kết quả cho "${params.search}".` : undefined
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination meta={meta} onPageChange={setPage} />
            </>
          )
        }
      </QueryState>
    </div>
  );
}
