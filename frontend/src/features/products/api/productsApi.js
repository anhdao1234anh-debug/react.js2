import { httpClient, unwrap, unwrapPage } from '@/core/api/httpClient';

export const productsApi = {
  /** @param {{ page?: number, limit?: number, search?: string, sort?: string, minPrice?: number, maxPrice?: number }} params */
  list: (params) => httpClient.get('/products', { params }).then(unwrapPage),
  getById: (id) => httpClient.get(`/products/${id}`).then(unwrap),
  create: (data) => httpClient.post('/products', data).then(unwrap),
  update: (id, data) => httpClient.patch(`/products/${id}`, data).then(unwrap),
  remove: (id) => httpClient.delete(`/products/${id}`),
};
