import { Link, useParams } from 'react-router';
import { QueryState } from '@/core/components/feedback/QueryState';
import { Card } from '@/core/components/ui';
import { formatCurrency, formatDate } from '@/core/utils/format';
import { PATHS } from '@/routes/paths';
import { ProductThumbnail } from '../components/ProductCard';
import { useProduct } from '../hooks/useProducts';

export default function ProductDetailPage() {
  const { id } = useParams();
  const productQuery = useProduct(id);

  return (
    <div className="space-y-6">
      <Link to={PATHS.products} className="text-sm font-medium text-brand-600 hover:underline">
        ← Tất cả sản phẩm
      </Link>
      <QueryState query={productQuery} loadingLabel="Đang tải sản phẩm...">
        {(product) => (
          <Card className="grid overflow-hidden md:grid-cols-2">
            <ProductThumbnail product={product} className="aspect-square md:rounded-r-none" />
            <div className="space-y-4 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
              <p className="text-2xl font-semibold text-brand-600">
                {formatCurrency(product.price)}
              </p>
              <p className="whitespace-pre-line text-gray-600">
                {product.description || 'Chưa có mô tả.'}
              </p>
              <p className="text-xs text-gray-400">Cập nhật: {formatDate(product.updatedAt)}</p>
            </div>
          </Card>
        )}
      </QueryState>
    </div>
  );
}
