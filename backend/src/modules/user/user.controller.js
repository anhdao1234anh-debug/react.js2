import { asyncHandlers } from '#core/http/asyncHandler.js';
import { sendNoContent, sendPaginated, sendSuccess } from '#core/http/response.js';
import { toAuthUser } from '#modules/auth/auth.serializer.js';
import { userService } from './user.service.js';

// Controller mỏng: đọc input đã validate -> gọi service -> trả response chuẩn.
export const userController = asyncHandlers({
  async list(req, res) {
    const result = await userService.listUsers(req.query);
    sendPaginated(res, result);
  },

  async getById(req, res) {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, { data: user });
  },

  async updateMe(req, res) {
    const user = await userService.updateProfile(req.user.id, req.body);
    sendSuccess(res, { data: toAuthUser(user), message: 'Cập nhật hồ sơ thành công' });
  },

  async update(req, res) {
    const user = await userService.updateUser(req.user, req.params.id, req.body);
    sendSuccess(res, { data: user, message: 'Cập nhật người dùng thành công' });
  },

  async updateRole(req, res) {
    const user = await userService.changeRole(req.user, req.params.id, req.body.role);
    sendSuccess(res, { data: user, message: 'Cập nhật quyền thành công' });
  },

  async remove(req, res) {
    await userService.deleteUser(req.user, req.params.id);
    sendNoContent(res);
  },
});
