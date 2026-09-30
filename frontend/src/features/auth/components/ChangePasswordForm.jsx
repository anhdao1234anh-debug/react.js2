import { useMemo } from 'react';
import { Alert, Button, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { toast } from '@/core/lib/toast';
import { useChangePassword } from '../hooks/useAuthMutations';
import { createChangePasswordSchema } from '../schemas/authSchemas';

/** Đổi mật khẩu (hoặc đặt mật khẩu lần đầu với tài khoản OAuth / magic link). */
export function ChangePasswordForm({ hasPassword }) {
  const changePassword = useChangePassword();
  const schema = useMemo(() => createChangePasswordSchema({ hasPassword }), [hasPassword]);
  const { form, submit, formError, isSubmitting } = useFormMutation({
    schema,
    mutation: changePassword,
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    transform: ({ currentPassword, newPassword }) =>
      hasPassword ? { currentPassword, newPassword } : { newPassword },
    resetOnSuccess: true,
    onSuccess: () =>
      toast.success(
        hasPassword ? 'Đã đổi mật khẩu' : 'Đã đặt mật khẩu',
        'Các thiết bị khác đã bị đăng xuất.',
      ),
  });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {!hasPassword && (
        <Alert variant="info">
          Tài khoản của bạn chưa có mật khẩu (đăng nhập bằng mạng xã hội / magic link). Đặt mật khẩu
          để có thể đăng nhập bằng email + mật khẩu.
        </Alert>
      )}
      {formError && <Alert variant="error">{formError}</Alert>}
      {hasPassword && (
        <TextField
          label="Mật khẩu hiện tại"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
      )}
      <TextField
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <TextField
        label="Xác nhận mật khẩu mới"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" loading={isSubmitting}>
        {hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
      </Button>
    </form>
  );
}
