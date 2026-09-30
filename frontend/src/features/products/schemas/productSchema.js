import { z } from 'zod';
import { optionalUrlSchema } from '@/core/validation/common';

// Khớp với backend/src/modules/product/product.schema.js
export const productFormSchema = z.object({
  title: z.string().trim().min(2, 'Tên sản phẩm tối thiểu 2 ký tự').max(200, 'Tối đa 200 ký tự'),
  // Ô number rỗng trả về '' -> coerce thành 0; chuyển '' thành undefined để báo "bắt buộc"
  price: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce
      .number({ error: 'Vui lòng nhập giá hợp lệ' })
      .min(0, 'Giá không được âm')
      .max(1_000_000_000, 'Giá quá lớn'),
  ),
  description: z.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự'),
  thumbnail: optionalUrlSchema,
});

export const emptyProductForm = { title: '', price: '', description: '', thumbnail: '' };

/** Chuyển product từ API -> giá trị form (field null -> chuỗi rỗng). */
export function toProductFormValues(product) {
  if (!product) return emptyProductForm;
  return {
    title: product.title ?? '',
    price: product.price ?? '',
    description: product.description ?? '',
    thumbnail: product.thumbnail ?? '',
  };
}
