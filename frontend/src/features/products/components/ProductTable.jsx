import { Link } from 'react-router';
import { Button } from '@/core/components/ui';
import { PERMISSIONS } from '@/core/constants/rbac';
import { formatCurrency, formatDateTime } from '@/core/utils/format';
import { Can } from '@/features/auth';
import { PATHS } from '@/routes/paths';

export function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
          <tr>
            <th className="px-4 py-3">Sản phẩm</th>
            <th className="px-4 py-3">Giá</th>
            <th className="hidden px-4 py-3 md:table-cell">Cập nhật</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-4 py-3">
                <Link
                  to={PATHS.productDetail(product.id)}
                  className="font-medium text-gray-900 hover:text-brand-700"
                >
                  {product.title}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(product.price)}</td>
              <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                {formatDateTime(product.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Can permission={PERMISSIONS.PRODUCT_UPDATE}>
                    <Button size="sm" variant="secondary" onClick={() => onEdit(product)}>
                      Sửa
                    </Button>
                  </Can>
                  <Can permission={PERMISSIONS.PRODUCT_DELETE}>
                    <Button size="sm" variant="danger" onClick={() => onDelete(product)}>
                      Xoá
                    </Button>
                  </Can>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
