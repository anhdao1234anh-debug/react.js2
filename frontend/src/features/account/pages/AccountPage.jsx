import { Card, CardBody, CardHeader } from '@/core/components/ui';
import { ChangePasswordForm, useAuth } from '@/features/auth';
import { EmailVerificationNotice } from '../components/EmailVerificationNotice';
import { ProfileForm } from '../components/ProfileForm';
import { SessionList } from '../components/SessionList';

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <EmailVerificationNotice />
      <Card>
        <CardHeader title="Hồ sơ cá nhân" description="Thông tin hiển thị với người khác." />
        <CardBody>
          <ProfileForm user={user} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title={user.hasPassword === false ? 'Đặt mật khẩu' : 'Đổi mật khẩu'}
          description="Sau khi đổi, các thiết bị khác sẽ bị đăng xuất."
        />
        <CardBody>
          <ChangePasswordForm hasPassword={user.hasPassword !== false} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Thiết bị đang đăng nhập" />
        <CardBody>
          <SessionList />
        </CardBody>
      </Card>
    </div>
  );
}
