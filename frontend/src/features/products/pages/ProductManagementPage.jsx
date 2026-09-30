import { QueryState } from '@/core/components/feedback/QueryState';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Modal,
  Pagination,
} from '@/core/components/ui';
import { PERMISSIONS } from '@/core/constants/rbac';
import { Can } from '@/features/auth';
import { ProductFilters } from '../components/ProductFilters';
import { ProductForm } from '../components/ProductForm';
import { ProductTable } from '../components/ProductTable';
import { useProductManagement } from '../hooks/useProductManagement';

/** Trang quản trị sản phẩm - toàn bộ logic nằm trong useProductManagement. */
export default function ProductManagementPage() {
  const {
    params,
    setParams,
    setPage,
    productsQuery,
    formModal,
    deleteDialog,
    editingProduct,
    saveProduct,
    confirmDelete,
    isDeleting,
  } = useProductManagement();

  return (
    <Card>
      <CardHeader
        title="Quản lý sản phẩm"
        description="Thêm, sửa, xoá sản phẩm hiển thị trên cửa hàng."
        action={
          <Can permission={PERMISSIONS.PRODUCT_CREATE}>
            <Button onClick={() => formModal.open(null)}>+ Thêm sản phẩm</Button>
          </Can>
        }
      />
      <CardBody className="space-y-4">
        <ProductFilters params={params} onChange={setParams} />
        <QueryState query={productsQuery}>
          {({ items, meta }) =>
            items.length === 0 ? (
              <EmptyState title="Chưa có sản phẩm" description="Bấm “Thêm sản phẩm” để bắt đầu." />
            ) : (
              <>
                <ProductTable
                  products={items}
                  onEdit={formModal.open}
                  onDelete={deleteDialog.open}
                />
                <Pagination meta={meta} onPageChange={setPage} />
              </>
            )
          }
        </QueryState>
      </CardBody>

      <Modal
        open={formModal.isOpen}
        onClose={formModal.close}
        title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      >
        <ProductForm product={editingProduct} onSubmit={saveProduct} onCancel={formModal.close} />
      </Modal>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title="Xoá sản phẩm?"
        description={`"${deleteDialog.data?.title}" sẽ bị xoá vĩnh viễn.`}
        confirmText="Xoá"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onClose={deleteDialog.close}
      />
    </Card>
  );
}
