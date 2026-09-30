import { useState } from 'react';
import { Link } from 'react-router';
import { Alert } from '@/core/components/ui';
import { PATHS } from '@/routes/paths';
import { AuthCard } from '../components/AuthCard';
import { EmailRequestForm } from '../components/EmailRequestForm';
import { useForgotPassword } from '../hooks/useAuthMutations';

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [message, setMessage] = useState(null);

  return (
    <AuthCard
      title="Quên mật khẩu"
      description="Nhập email đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu."
      footer={
        <Link to={PATHS.login} className="font-medium text-brand-600 hover:underline">
          ← Quay lại đăng nhập
        </Link>
      }
    >
      {message ? (
        <Alert variant="success" title="Đã gửi yêu cầu">
          {message}
        </Alert>
      ) : (
        <EmailRequestForm
          mutation={forgotPassword}
          submitText="Gửi hướng dẫn"
          onSuccess={(serverMessage) => setMessage(serverMessage)}
        />
      )}
    </AuthCard>
  );
}
