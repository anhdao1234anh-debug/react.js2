import { AppError } from '#core/errors/AppError.js';
import { parseSort } from '#core/utils/sort.js';
import { containsRegex } from '#core/utils/string.js';
import { productRepository } from './product.repository.js';
import { PRODUCT_SORT_FIELDS } from './product.schema.js';

export const productService = {
  async list({ page, limit, search, sort, minPrice, maxPrice }) {
    const filter = {};
    if (search) filter.title = containsRegex(search);
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    return productRepository.paginate(filter, {
      page,
      limit,
      sort: parseSort(sort, PRODUCT_SORT_FIELDS),
    });
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw AppError.notFound('Sản phẩm');
    return product;
  },

  create(data, actor) {
    return productRepository.create({ ...data, createdBy: actor._id, updatedBy: actor._id });
  },

  async update(id, data, actor) {
    const product = await productRepository.updateById(id, { ...data, updatedBy: actor._id });
    if (!product) throw AppError.notFound('Sản phẩm');
    return product;
  },

  async remove(id) {
    const product = await productRepository.deleteById(id);
    if (!product) throw AppError.notFound('Sản phẩm');
  },
};
