// Hook dữ liệu của feature products: mọi component dùng lại, không gọi API trực tiếp.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { productKeys } from '../productKeys';

/** Danh sách có phân trang; giữ dữ liệu trang cũ khi chuyển trang (không nháy loading). */
export function useProducts(params) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.remove,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
