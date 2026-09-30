import { Alert, Button, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { emailOnlySchema } from '../schemas/authSchemas';

/**
 * Form chỉ gồm ô email - dùng chung cho "gửi magic link" và "quên mật khẩu".
 * @param {{ mutation: import('@tanstack/react-query').UseMutationResult, submitText: string,
 *           extraValues?: object, onSuccess?: (message: string, values: {email: string}) => void }} props
 */
export function EmailRequestForm({ mutation, submitText, extraValues, onSuccess }) {
  const { form, submit, formError, isSubmitting } = useFormMutation({
    schema: emailOnlySchema,
    mutation,
    defaultValues: { email: '' },
    transform: (values) => ({ ...values, ...extraValues }),
    onSuccess,
  });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" className="w-full" loading={isSubmitting}>
        {submitText}
      </Button>
    </form>
  );
}
