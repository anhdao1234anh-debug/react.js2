import { Alert, Button, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { useRegister } from '../hooks/useAuthMutations';
import { registerSchema } from '../schemas/authSchemas';

export function RegisterForm({ onSuccess }) {
  const registerMutation = useRegister();
  const { form, submit, formError, isSubmitting } = useFormMutation({
    schema: registerSchema,
    mutation: registerMutation,
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    transform: ({ confirmPassword: _confirm, ...values }) => values,
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
        label="Họ tên"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Mật khẩu"
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
        Tạo tài khoản
      </Button>
    </form>
  );
}
