import { Outlet, ScrollRestoration } from 'react-router';

/** Layout gốc của router: thành phần cần router context dùng cho mọi trang. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
