import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alert } from '@/core/components/ui';
import { toast } from '@/core/lib/toast';
import { PATHS } from '@/routes/paths';
import { AuthCard } from '../components/AuthCard';
import { ResetPasswordForm } from '../components/ResetPasswordForm';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSuccess = (message) => {
    toast.success('Đặt lại mật khẩu thành công', message);
    navigate(PATHS.login, { replace: true });
  };

  return (
    <AuthCard
      title="Đặt lại mật khẩu"
      footer={
        <Link to={PATHS.forgotPassword} className="font-medium text-brand-600 hover:underline">
          Yêu cầu liên kết mới
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} onSuccess={handleSuccess} />
      ) : (
        <Alert variant="error">Liên kết đặt lại mật khẩu không hợp lệ.</Alert>
      )}
    </AuthCard>
  );
}
