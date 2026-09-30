import { Alert, Button, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { useResetPassword } from '../hooks/useAuthMutations';
import { resetPasswordSchema } from '../schemas/authSchemas';

export function ResetPasswordForm({ token, onSuccess }) {
  const resetPassword = useResetPassword();
  const { form, submit, formError, isSubmitting } = useFormMutation({
    schema: resetPasswordSchema,
    mutation: resetPassword,
    defaultValues: { password: '', confirmPassword: '' },
    transform: ({ password }) => ({ token, password }),
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
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        hint="Tối thiểu 8 ký tự, gồm chữ và số"
        error={errors.password?.message}
        {...register('password')}
      />
      <TextField
        label="Xác nhận mật khẩu"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Đặt lại mật khẩu
      </Button>
    </form>
  );
}
