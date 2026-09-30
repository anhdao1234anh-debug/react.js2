import { asyncHandlers } from '#core/http/asyncHandler.js';
import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from '#core/http/response.js';
import { productService } from './product.service.js';

export const productController = asyncHandlers({
  async list(req, res) {
    sendPaginated(res, await productService.list(req.query));
  },

  async getById(req, res) {
    sendSuccess(res, { data: await productService.getById(req.params.id) });
  },

  async create(req, res) {
    const product = await productService.create(req.body, req.user);
    sendCreated(res, product, 'Tạo sản phẩm thành công');
  },

  async update(req, res) {
    const product = await productService.update(req.params.id, req.body, req.user);
    sendSuccess(res, { data: product, message: 'Cập nhật sản phẩm thành công' });
  },

  async remove(req, res) {
    await productService.remove(req.params.id);
    sendNoContent(res);
  },
});
