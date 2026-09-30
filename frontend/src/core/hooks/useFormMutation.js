import { useState } from 'react';
import { getErrorMessage } from '@/core/api/apiError';
import { applyServerErrors } from '@/core/utils/form';
import { useZodForm } from './useZodForm';

/**
 * Kết hợp form (react-hook-form + Zod) với thao tác gọi API - pattern dùng lại cho MỌI form:
 *  1. Validate client bằng Zod
 *  2. Gọi `mutation.mutateAsync(values)` (TanStack mutation) hoặc `mutationFn(values)` (hàm async)
 *  3. Lỗi 422 từ server -> gắn vào đúng field; lỗi khác -> formError (hiển thị Alert)
 *
 * @param {{
 *   schema: import('zod').ZodType,
 *   mutation?: import('@tanstack/react-query').UseMutationResult,
 *   mutationFn?: (values: any) => Promise<any>,
 *   defaultValues?: object,
 *   transform?: (values: any) => any,
 *   onSuccess?: (result: any, values: any) => void | Promise<void>,
 *   resetOnSuccess?: boolean,
 * }} options
 */
export function useFormMutation({
  schema,
  mutation,
  mutationFn,
  defaultValues,
  transform = (values) => values,
  onSuccess,
  resetOnSuccess = false,
}) {
  const form = useZodForm(schema, { defaultValues });
  const [formError, setFormError] = useState(null);
  const run = mutationFn ?? mutation.mutateAsync;

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await run(transform(values));
      if (resetOnSuccess) form.reset();
      await onSuccess?.(result, values);
    } catch (error) {
      const fieldNames = Object.keys(form.getValues());
      const hasUnmapped = applyServerErrors(form.setError, error, fieldNames);
      if (hasUnmapped) setFormError(getErrorMessage(error));
    }
  });

  return {
    form,
    submit,
    formError,
    isSubmitting: form.formState.isSubmitting || Boolean(mutation?.isPending),
  };
}
