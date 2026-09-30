import { Link, useNavigate, useSearchParams } from 'react-router';
import { getErrorMessage } from '@/core/api/apiError';
import { PageLoader } from '@/core/components/feedback/PageLoader';
import { Alert, buttonVariants } from '@/core/components/ui';
import { useRunOnce } from '@/core/hooks/useRunOnce';
import { PATHS, safeRedirectPath } from '@/routes/paths';
import { AuthCard } from '../components/AuthCard';
import { useVerifyMagicLink } from '../hooks/useAuthMutations';

/** Trang đích của link trong email: tự xác thực token rồi chuyển hướng. */
export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verify = useVerifyMagicLink();
  const token = searchParams.get('token');

  useRunOnce(() => {
    if (!token) return;
    verify.mutate(token, {
      onSuccess: (session) => navigate(safeRedirectPath(session.redirectTo), { replace: true }),
    });
  });

  if (token && !verify.isError) return <PageLoader label="Đang đăng nhập..." />;

  return (
    <AuthCard title="Không thể đăng nhập">
      <Alert variant="error">
        {token ? getErrorMessage(verify.error) : 'Liên kết đăng nhập không hợp lệ.'}
      </Alert>
      <Link to={PATHS.magicLink} className={buttonVariants({ className: 'mt-6 w-full' })}>
        Gửi liên kết mới
      </Link>
    </AuthCard>
  );
}
