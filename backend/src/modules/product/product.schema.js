import { z } from 'zod';
import { idParamsSchema, paginationQuerySchema } from '#core/validation/common.js';

export const PRODUCT_SORT_FIELDS = ['createdAt', 'price', 'title'];

const productFields = {
  title: z
    .string({ error: 'Tên sản phẩm là bắt buộc' })
    .trim()
    .min(2, 'Tên sản phẩm tối thiểu 2 ký tự')
    .max(200, 'Tên sản phẩm tối đa 200 ký tự'),
  price: z.coerce
    .number({ error: 'Giá phải là số' })
    .min(0, 'Giá không được âm')
    .max(1_000_000_000, 'Giá quá lớn'),
  description: z.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự').optional(),
  thumbnail: z.url('URL ảnh không hợp lệ').max(500).or(z.literal('')).optional(),
};

export const createProductSchema = {
  body: z.object(productFields).strict(),
};

export const updateProductSchema = {
  params: idParamsSchema,
  body: z
    .object(productFields)
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, 'Cần ít nhất 1 trường để cập nhật'),
};

export const productIdSchema = { params: idParamsSchema };

export const listProductsSchema = {
  query: paginationQuerySchema({
    sortFields: PRODUCT_SORT_FIELDS,
    extend: {
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
    },
  }).refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { path: ['maxPrice'], message: 'maxPrice phải lớn hơn hoặc bằng minPrice' },
  ),
};
