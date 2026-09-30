import { Link, Navigate, useSearchParams } from 'react-router';
import { PageLoader } from '@/core/components/feedback/PageLoader';
import { Alert, buttonVariants } from '@/core/components/ui';
import { PATHS, safeRedirectPath } from '@/routes/paths';
import { AuthCard } from '../components/AuthCard';
import { useAuth } from '../hooks/useAuth';

const ERROR_MESSAGES = {
  OAUTH_ACCESS_DENIED: 'Bạn đã huỷ cấp quyền đăng nhập.',
  OAUTH_STATE_MISMATCH: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng thử lại.',
  OAUTH_EMAIL_REQUIRED: 'Tài khoản mạng xã hội không cung cấp email.',
  CONFLICT: 'Email này đã được đăng ký bằng phương thức khác. Hãy đăng nhập bằng phương thức đó.',
  ACCOUNT_DISABLED: 'Tài khoản của bạn đã bị khoá.',
};

/**
 * Backend redirect về đây sau OAuth (?status=success|error&code=...).
 * Thành công: refresh cookie đã được set -> useAuth tự lấy phiên -> chuyển hướng.
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const { isLoading, isAuthenticated } = useAuth();

  if (status === 'success') {
    if (isLoading) return <PageLoader label="Đang hoàn tất đăng nhập..." />;
    if (isAuthenticated) {
      return <Navigate to={safeRedirectPath(searchParams.get('redirectTo'))} replace />;
    }
  }

  const code = searchParams.get('code');
  return (
    <AuthCard title="Đăng nhập thất bại">
      <Alert variant="error">
        {ERROR_MESSAGES[code] ?? 'Không thể hoàn tất đăng nhập bằng mạng xã hội. Vui lòng thử lại.'}
      </Alert>
      <Link to={PATHS.login} className={buttonVariants({ className: 'mt-6 w-full' })}>
        Quay lại đăng nhập
      </Link>
    </AuthCard>
  );
}
