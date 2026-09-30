import { getErrorMessage } from '@/core/api/apiError';
import { Alert, Button } from '@/core/components/ui';
import { toast } from '@/core/lib/toast';
import { useAuth, useResendVerification } from '@/features/auth';

/** Nhắc xác thực email + nút gửi lại (ẩn khi đã xác thực). */
export function EmailVerificationNotice() {
  const { user } = useAuth();
  const resend = useResendVerification();

  if (!user || user.isEmailVerified) return null;

  const handleResend = () =>
    resend.mutate(undefined, {
      onSuccess: (message) => toast.success(message ?? 'Đã gửi lại email xác thực'),
      onError: (error) => toast.error('Gửi thất bại', getErrorMessage(error)),
    });

  return (
    <Alert
      variant="warning"
      title="Email chưa được xác thực"
      action={
        <Button size="sm" variant="secondary" loading={resend.isPending} onClick={handleResend}>
          Gửi lại email
        </Button>
      }
    >
      Kiểm tra hộp thư {user.email} để xác thực tài khoản.
    </Alert>
  );
}
