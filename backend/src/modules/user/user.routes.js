import { Router } from 'express';
import { validate } from '#core/middlewares/validate.js';
import { PERMISSIONS, authorize } from '#core/rbac/index.js';
import { authenticate } from '#modules/auth/auth.middleware.js';
import { userController } from './user.controller.js';
import {
  listUsersSchema,
  updateProfileSchema,
  updateRoleSchema,
  updateUserSchema,
  userIdSchema,
} from './user.schema.js';

const router = Router();

// Mọi route /users đều yêu cầu đăng nhập
router.use(authenticate);

// Hồ sơ cá nhân (đặt TRƯỚC "/:id" để "me" không bị hiểu là id)
router.patch(
  '/me',
  authorize(PERMISSIONS.PROFILE_UPDATE),
  validate(updateProfileSchema),
  userController.updateMe,
);

// Quản trị người dùng
router.get('/', authorize(PERMISSIONS.USER_READ), validate(listUsersSchema), userController.list);
router.get(
  '/:id',
  authorize(PERMISSIONS.USER_READ),
  validate(userIdSchema),
  userController.getById,
);
router.patch(
  '/:id',
  authorize(PERMISSIONS.USER_UPDATE),
  validate(updateUserSchema),
  userController.update,
);
router.patch(
  '/:id/role',
  authorize(PERMISSIONS.USER_ROLE_UPDATE),
  validate(updateRoleSchema),
  userController.updateRole,
);
router.delete(
  '/:id',
  authorize(PERMISSIONS.USER_DELETE),
  validate(userIdSchema),
  userController.remove,
);

export default router;
