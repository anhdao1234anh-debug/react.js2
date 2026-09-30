import { Alert, Button, TextareaField, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { productFormSchema, toProductFormValues } from '../schemas/productSchema';

/**
 * Form tạo/sửa sản phẩm (dùng chung). `onSubmit` là hàm async trả về promise:
 * lỗi 422 từ server sẽ được gắn vào đúng field.
 */
export function ProductForm({ product, onSubmit, onCancel }) {
  const { form, submit, formError, isSubmitting } = useFormMutation({
    schema: productFormSchema,
    mutationFn: onSubmit,
    defaultValues: toProductFormValues(product),
  });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <TextField
        label="Tên sản phẩm"
        required
        error={errors.title?.message}
        {...register('title')}
      />
      <TextField
        label="Giá (VND)"
        type="number"
        inputMode="numeric"
        min={0}
        required
        error={errors.price?.message}
        {...register('price')}
      />
      <TextField
        label="Ảnh (URL)"
        type="url"
        placeholder="https://..."
        hint="Phase quản lý file sẽ thay bằng upload lên Cloudflare R2"
        error={errors.thumbnail?.message}
        {...register('thumbnail')}
      />
      <TextareaField
        label="Mô tả"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Huỷ
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
        </Button>
      </div>
    </form>
  );
}
