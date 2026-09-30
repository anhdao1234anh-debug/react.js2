import { Link, useNavigate, useSearchParams } from 'react-router';
import { buttonVariants } from '@/core/components/ui';
import { PATHS, safeRedirectPath } from '@/routes/paths';
import { AuthCard, AuthDivider } from '../components/AuthCard';
import { LoginForm } from '../components/LoginForm';
import { OAuthButtons } from '../components/OAuthButtons';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'));
  const magicLinkUrl = `${PATHS.magicLink}?redirectTo=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthCard
      title="Đăng nhập"
      description="Chào mừng bạn quay lại!"
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link to={PATHS.register} className="font-medium text-brand-600 hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
      <AuthDivider />
      <div className="space-y-2">
        <Link
          to={magicLinkUrl}
          className={buttonVariants({ variant: 'secondary', className: 'w-full' })}
        >
          Đăng nhập bằng liên kết email (Magic link)
        </Link>
        <OAuthButtons redirectTo={redirectTo} />
      </div>
    </AuthCard>
  );
}
