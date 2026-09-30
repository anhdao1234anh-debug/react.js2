import { Outlet } from 'react-router';
import { ForbiddenPage } from '@/features/errors/pages/ForbiddenPage';
import { useAuth } from '../hooks/useAuth';

/**
 * Chỉ render khi user có permission (và/hoặc thuộc role) yêu cầu. Đặt BÊN TRONG RequireAuth.
 * Đây là lớp UX - backend vẫn kiểm tra quyền ở mọi API.
 *
 * @param {{ permission?: string, roles?: string[], fallback?: import('react').ReactNode, children?: import('react').ReactNode }} props
 */
export function RequirePermission({ permission, roles, fallback = <ForbiddenPage />, children }) {
  const { can, hasRole } = useAuth();
  const allowed = (!permission || can(permission)) && (!roles || hasRole(...roles));
  if (!allowed) return fallback;
  return children ?? <Outlet />;
}

/** Ẩn/hiện một phần UI theo quyền (nút "Thêm", menu...). */
export function Can({ permission, children, fallback = null }) {
  const { can } = useAuth();
  return can(permission) ? children : fallback;
}
