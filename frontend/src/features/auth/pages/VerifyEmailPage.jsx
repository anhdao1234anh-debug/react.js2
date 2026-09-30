import { Link, useSearchParams } from 'react-router';
import { getErrorMessage } from '@/core/api/apiError';
import { PageLoader } from '@/core/components/feedback/PageLoader';
import { Alert, buttonVariants } from '@/core/components/ui';
import { useRunOnce } from '@/core/hooks/useRunOnce';
import { PATHS } from '@/routes/paths';
import { AuthCard } from '../components/AuthCard';
import { useVerifyEmail } from '../hooks/useAuthMutations';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verify = useVerifyEmail();

  useRunOnce(() => {
    if (token) verify.mutate(token);
  });

  if (token && (verify.isIdle || verify.isPending)) {
    return <PageLoader label="Đang xác thực email..." />;
  }

  return (
    <AuthCard title="Xác thực email">
      {verify.isSuccess ? (
        <Alert variant="success">{verify.data ?? 'Xác thực email thành công'}</Alert>
      ) : (
        <Alert variant="error">
          {token ? getErrorMessage(verify.error) : 'Liên kết xác thực không hợp lệ.'}
        </Alert>
      )}
      <Link to={PATHS.dashboard} className={buttonVariants({ className: 'mt-6 w-full' })}>
        Tới bảng điều khiển
      </Link>
    </AuthCard>
  );
}
