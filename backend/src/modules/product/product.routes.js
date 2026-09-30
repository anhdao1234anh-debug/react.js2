import { Router } from 'express';
import { validate } from '#core/middlewares/validate.js';
import { PERMISSIONS, authorize } from '#core/rbac/index.js';
import { authenticate } from '#modules/auth/auth.middleware.js';
import { productController } from './product.controller.js';
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  updateProductSchema,
} from './product.schema.js';

const router = Router();

// Public: xem danh sách & chi tiết
router.get('/', validate(listProductsSchema), productController.list);
router.get('/:id', validate(productIdSchema), productController.getById);

// Quản trị: cần đăng nhập + permission
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.PRODUCT_CREATE),
  validate(createProductSchema),
  productController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.PRODUCT_UPDATE),
  validate(updateProductSchema),
  productController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.PRODUCT_DELETE),
  validate(productIdSchema),
  productController.remove,
);

export default router;
