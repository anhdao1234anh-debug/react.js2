import { Outlet } from 'react-router';
import { env } from '@/core/config/env';
import { SiteHeader } from './components/SiteHeader';

/** Layout trang public: header + nội dung + footer. */
export function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6">
          © {new Date().getFullYear()} {env.appName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
