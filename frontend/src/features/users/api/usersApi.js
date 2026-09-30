import { httpClient, unwrap, unwrapPage } from '@/core/api/httpClient';

export const usersApi = {
  /** @param {{ page?: number, limit?: number, search?: string, sort?: string, role?: string }} params */
  list: (params) => httpClient.get('/users', { params }).then(unwrapPage),
  getById: (id) => httpClient.get(`/users/${id}`).then(unwrap),
  update: (id, data) => httpClient.patch(`/users/${id}`, data).then(unwrap),
  updateRole: (id, role) => httpClient.patch(`/users/${id}/role`, { role }).then(unwrap),
  remove: (id) => httpClient.delete(`/users/${id}`),
  /** Người dùng tự sửa hồ sơ. */
  updateMe: (data) => httpClient.patch('/users/me', data).then(unwrap),
};
