import { Link } from 'react-router';
import { Alert, Button, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { PATHS } from '@/routes/paths';
import { useLogin } from '../hooks/useAuthMutations';
import { loginSchema } from '../schemas/authSchemas';

export function LoginForm({ onSuccess }) {
  const login = useLogin();
  const { form, submit, formError, isSubmitting } = useFormMutation({
    schema: loginSchema,
    mutation: login,
    defaultValues: { email: '', password: '' },
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
      <TextField
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex justify-end">
        <Link
          to={PATHS.forgotPassword}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Quên mật khẩu?
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Đăng nhập
      </Button>
    </form>
  );
}
