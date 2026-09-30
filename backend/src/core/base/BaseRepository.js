import { buildPaginationMeta, normalizePagination } from '#core/utils/pagination.js';

/**
 * Repository cơ sở: gom các thao tác CRUD lặp lại cho mọi Mongoose model.
 * Module chỉ cần `class ProductRepository extends BaseRepository` rồi bổ sung query riêng.
 * Service KHÔNG gọi Model trực tiếp -> dễ thay DB / mock khi test / thêm cache (phase caching).
 *
 * @template T
 */
export class BaseRepository {
  /** @param {import('mongoose').Model<T>} model */
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findById(id, { select, populate } = {}) {
    const query = this.model.findById(id);
    if (select) query.select(select);
    if (populate) query.populate(populate);
    return query.exec();
  }

  findOne(filter, { select, populate } = {}) {
    const query = this.model.findOne(filter);
    if (select) query.select(select);
    if (populate) query.populate(populate);
    return query.exec();
  }

  find(filter = {}, { select, sort, limit } = {}) {
    const query = this.model.find(filter);
    if (select) query.select(select);
    if (sort) query.sort(sort);
    if (limit) query.limit(limit);
    return query.exec();
  }

  async exists(filter) {
    return Boolean(await this.model.exists(filter));
  }

  count(filter = {}) {
    return this.model.countDocuments(filter).exec();
  }

  /** Cập nhật và trả về document SAU khi cập nhật (chạy validator của schema). */
  updateById(id, update) {
    return this.model
      .findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true })
      .exec();
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id).exec();
  }

  /**
   * Phân trang chuẩn.
   * @returns {Promise<{ items: T[], meta: ReturnType<typeof buildPaginationMeta> }>}
   */
  async paginate(filter = {}, { page, limit, sort = { createdAt: -1 }, select, populate } = {}) {
    const pagination = normalizePagination({ page, limit });
    const query = this.model.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit);
    if (select) query.select(select);
    if (populate) query.populate(populate);

    const [items, total] = await Promise.all([query.exec(), this.model.countDocuments(filter)]);
    return {
      items,
      meta: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }),
    };
  }
}
