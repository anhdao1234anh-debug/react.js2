import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Alert, Button } from '@/core/components/ui';
import { PATHS, safeRedirectPath } from '@/routes/paths';
import { AuthCard } from '../components/AuthCard';
import { EmailRequestForm } from '../components/EmailRequestForm';
import { useRequestMagicLink } from '../hooks/useAuthMutations';

export default function MagicLinkPage() {
  const [searchParams] = useSearchParams();
  const requestMagicLink = useRequestMagicLink();
  const [sentTo, setSentTo] = useState(null);
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'));

  return (
    <AuthCard
      title="Đăng nhập không cần mật khẩu"
      description="Nhập email, chúng tôi sẽ gửi cho bạn một liên kết đăng nhập."
      footer={
        <Link to={PATHS.login} className="font-medium text-brand-600 hover:underline">
          ← Quay lại đăng nhập bằng mật khẩu
        </Link>
      }
    >
      {sentTo ? (
        <div className="space-y-4">
          <Alert variant="success" title="Đã gửi liên kết!">
            Kiểm tra hộp thư <strong>{sentTo}</strong> và nhấn vào liên kết để đăng nhập. Liên kết
            chỉ dùng được một lần.
          </Alert>
          <Button variant="secondary" className="w-full" onClick={() => setSentTo(null)}>
            Gửi lại / dùng email khác
          </Button>
        </div>
      ) : (
        <EmailRequestForm
          mutation={requestMagicLink}
          submitText="Gửi liên kết đăng nhập"
          extraValues={{ redirectTo }}
          onSuccess={(_message, values) => setSentTo(values.email)}
        />
      )}
    </AuthCard>
  );
}
