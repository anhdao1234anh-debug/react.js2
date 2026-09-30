import { Link } from 'react-router';
import { Card } from '@/core/components/ui';
import { formatCurrency } from '@/core/utils/format';
import { PATHS } from '@/routes/paths';

export function ProductThumbnail({ product, className = 'aspect-[4/3]' }) {
  return product.thumbnail ? (
    <img
      src={product.thumbnail}
      alt={product.title}
      loading="lazy"
      className={`w-full rounded-t-xl object-cover ${className}`}
    />
  ) : (
    <div
      className={`flex w-full items-center justify-center rounded-t-xl bg-gradient-to-br from-brand-50 to-brand-100 text-3xl font-bold text-brand-600 ${className}`}
    >
      {product.title.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function ProductCard({ product }) {
  return (
    <Card className="group overflow-hidden transition hover:shadow-md">
      <Link to={PATHS.productDetail(product.id)} className="block">
        <ProductThumbnail product={product} />
        <div className="space-y-1 p-4">
          <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-brand-700">
            {product.title}
          </h3>
          <p className="text-sm font-medium text-brand-600">{formatCurrency(product.price)}</p>
          {product.description && (
            <p className="line-clamp-2 text-sm text-gray-500">{product.description}</p>
          )}
        </div>
      </Link>
    </Card>
  );
}
