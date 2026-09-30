import { Link, NavLink, Outlet } from 'react-router';
import { Avatar, Button } from '@/core/components/ui';
import { env } from '@/core/config/env';
import { PERMISSIONS } from '@/core/constants/rbac';
import { useDisclosure } from '@/core/hooks/useDisclosure';
import { cn } from '@/core/lib/cn';
import { useAuth, useLogoutAction } from '@/features/auth';
import { RoleBadge } from '@/features/users';
import { PATHS } from '@/routes/paths';

/** Menu sidebar: mục có `permission` chỉ hiện khi user có quyền đó. */
const MENU = [
  { to: PATHS.dashboard, label: 'Tổng quan', end: true },
  { to: PATHS.account, label: 'Tài khoản' },
  { to: PATHS.manageProducts, label: 'Sản phẩm', permission: PERMISSIONS.PRODUCT_CREATE },
  { to: PATHS.manageUsers, label: 'Người dùng', permission: PERMISSIONS.USER_READ },
];

export function DashboardLayout() {
  const { user, can } = useAuth();
  const { logout, isLoggingOut } = useLogoutAction();
  const sidebar = useDisclosure();
  const menu = MENU.filter((item) => !item.permission || can(item.permission));

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside
        className={cn(
          'border-r border-gray-200 bg-white lg:block',
          sidebar.isOpen ? 'block' : 'hidden',
        )}
      >
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <Link to={PATHS.home} className="text-lg font-bold text-brand-700">
            {env.appName}
          </Link>
        </div>
        <nav aria-label="Menu quản trị" className="space-y-1 p-4">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={sidebar.close}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Mở menu quản trị"
            onClick={sidebar.toggle}
          >
            ☰
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <Avatar name={user.name} src={user.avatarUrl} />
            <Button variant="secondary" size="sm" loading={isLoggingOut} onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
