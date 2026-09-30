import { Link } from 'react-router';
import { Card, CardBody } from '@/core/components/ui';
import { PERMISSIONS } from '@/core/constants/rbac';
import { EmailVerificationNotice } from '@/features/account/components/EmailVerificationNotice';
import { useAuth } from '@/features/auth';
import { RoleBadge } from '@/features/users';
import { PATHS } from '@/routes/paths';

const SHORTCUTS = [
  { to: PATHS.account, title: 'Tài khoản', description: 'Hồ sơ, mật khẩu, thiết bị' },
  {
    to: PATHS.manageProducts,
    title: 'Sản phẩm',
    description: 'Thêm / sửa / xoá sản phẩm',
    permission: PERMISSIONS.PRODUCT_CREATE,
  },
  {
    to: PATHS.manageUsers,
    title: 'Người dùng',
    description: 'Khoá, phân quyền, xoá tài khoản',
    permission: PERMISSIONS.USER_READ,
  },
];

export default function DashboardPage() {
  const { user, can } = useAuth();
  const shortcuts = SHORTCUTS.filter((item) => !item.permission || can(item.permission));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user.name} 👋</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
          Vai trò hiện tại: <RoleBadge role={user.role} />
        </p>
      </div>

      <EmailVerificationNotice />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="h-full transition hover:shadow-md hover:ring-brand-200">
              <CardBody>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-gray-900">Quyền của bạn</p>
          <p className="mt-2 flex flex-wrap gap-2">
            {user.permissions.map((permission) => (
              <code
                key={permission}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {permission}
              </code>
            ))}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
