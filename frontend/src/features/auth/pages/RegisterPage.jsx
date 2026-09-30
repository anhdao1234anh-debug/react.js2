import { Link, useNavigate } from 'react-router';
import { toast } from '@/core/lib/toast';
import { DEFAULT_AUTHENTICATED_PATH, PATHS } from '@/routes/paths';
import { AuthCard, AuthDivider } from '../components/AuthCard';
import { OAuthButtons } from '../components/OAuthButtons';
import { RegisterForm } from '../components/RegisterForm';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    toast.success('Đăng ký thành công', 'Kiểm tra email để xác thực tài khoản.');
    navigate(DEFAULT_AUTHENTICATED_PATH, { replace: true });
  };

  return (
    <AuthCard
      title="Tạo tài khoản"
      description="Bắt đầu miễn phí trong vài giây"
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link to={PATHS.login} className="font-medium text-brand-600 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm onSuccess={handleSuccess} />
      <AuthDivider />
      <OAuthButtons />
    </AuthCard>
  );
}
