import { getErrorMessage } from '@/core/api/apiError';
import { Alert, Button } from '@/core/components/ui';
import { PageLoader } from './PageLoader';

/**
 * Hiển thị trạng thái loading / error thống nhất cho một TanStack query.
 * Chỉ render children khi đã có dữ liệu.
 * @example <QueryState query={productQuery}>{(product) => <ProductView product={product} />}</QueryState>
 */
export function QueryState({ query, loadingLabel, children }) {
  if (query.isPending) return <PageLoader label={loadingLabel} />;
  if (query.isError) {
    return (
      <Alert
        variant="error"
        title="Không tải được dữ liệu"
        action={
          <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        }
      >
        {getErrorMessage(query.error)}
      </Alert>
    );
  }
  return typeof children === 'function' ? children(query.data) : children;
}
