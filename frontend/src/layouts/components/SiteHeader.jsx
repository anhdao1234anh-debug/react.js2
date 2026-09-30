import { Link, NavLink } from 'react-router';
import { Avatar, Button, buttonVariants } from '@/core/components/ui';
import { env } from '@/core/config/env';
import { useDisclosure } from '@/core/hooks/useDisclosure';
import { cn } from '@/core/lib/cn';
import { useAuth, useLogoutAction } from '@/features/auth';
import { PATHS } from '@/routes/paths';

const NAV_ITEMS = [
  { to: PATHS.home, label: 'Trang chủ', end: true },
  { to: PATHS.products, label: 'Sản phẩm' },
  { to: PATHS.about, label: 'Giới thiệu' },
  { to: PATHS.contact, label: 'Liên hệ' },
];

const navLinkClass = ({ isActive }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  );

export function SiteHeader() {
  const { user, isAuthenticated } = useAuth();
  const { logout, isLoggingOut } = useLogoutAction();
  const mobileMenu = useDisclosure();

  const authActions = isAuthenticated ? (
    <>
      <Link to={PATHS.dashboard} className="flex items-center gap-2" onClick={mobileMenu.close}>
        <Avatar name={user.name} src={user.avatarUrl} className="size-8" />
        <span className="text-sm font-medium text-gray-700">{user.name}</span>
      </Link>
      <Button variant="ghost" size="sm" loading={isLoggingOut} onClick={logout}>
        Đăng xuất
      </Button>
    </>
  ) : (
    <>
      <Link to={PATHS.login} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        Đăng nhập
      </Link>
      <Link to={PATHS.register} className={buttonVariants({ size: 'sm' })}>
        Đăng ký
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={PATHS.home} className="text-lg font-bold text-brand-700">
          {env.appName}
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{authActions}</div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Mở menu"
          aria-expanded={mobileMenu.isOpen}
          onClick={mobileMenu.toggle}
        >
          ☰
        </Button>
      </div>

      {mobileMenu.isOpen && (
        <div className="space-y-1 border-t border-gray-100 px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={(state) => cn(navLinkClass(state), 'block')}
              onClick={mobileMenu.close}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="flex items-center gap-2 pt-2">{authActions}</div>
        </div>
      )}
    </header>
  );
}
