// Hook điều phối cho trang quản trị sản phẩm: gom state (bộ lọc URL, modal, xác nhận xoá)
// + dữ liệu + hành động. Trang chỉ còn phần hiển thị.
import { getErrorMessage } from '@/core/api/apiError';
import { useDisclosure } from '@/core/hooks/useDisclosure';
import { useListParams } from '@/core/hooks/useListParams';
import { toast } from '@/core/lib/toast';
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from './useProducts';

export function useProductManagement() {
  const { params, setParams, setPage } = useListParams({
    defaults: { limit: 10, sort: '-createdAt' },
  });
  const productsQuery = useProducts(params);

  const formModal = useDisclosure(); // data = product đang sửa (null = tạo mới)
  const deleteDialog = useDisclosure(); // data = product cần xoá

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const editingProduct = formModal.data;
  const saveMutation = editingProduct ? updateMutation : createMutation;

  /** Truyền vào ProductForm - form tự xử lý lỗi validate từ server. */
  const saveProduct = async (values) => {
    const result = editingProduct
      ? await updateMutation.mutateAsync({ id: editingProduct.id, data: values })
      : await createMutation.mutateAsync(values);
    toast.success(editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm');
    formModal.close();
    return result;
  };

  const confirmDelete = async () => {
    const product = deleteDialog.data;
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success('Đã xoá sản phẩm', product.title);
      deleteDialog.close();
    } catch (error) {
      toast.error('Xoá thất bại', getErrorMessage(error));
    }
  };

  return {
    params,
    setParams,
    setPage,
    productsQuery,
    formModal,
    deleteDialog,
    editingProduct,
    saveMutation,
    saveProduct,
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}
