import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

/**
 * react-hook-form + Zod resolver với cấu hình mặc định thống nhất.
 * @param {import('zod').ZodType} schema
 * @param {import('react-hook-form').UseFormProps} [options]
 */
export function useZodForm(schema, options = {}) {
  return useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    ...options,
  });
}
