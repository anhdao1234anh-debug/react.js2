import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { hasPermission } from '@/core/constants/rbac';
import { sessionQueryOptions } from '../lib/session';

/**
 * Hook trung tâm của auth: trạng thái đăng nhập + helper phân quyền cho UI.
 * @example const { user, isAuthenticated, can } = useAuth(); can('product:create')
 */
export function useAuth() {
  const query = useQuery(sessionQueryOptions);
  const user = query.data ?? null;

  return useMemo(
    () => ({
      user,
      isLoading: query.isPending,
      isError: query.isError,
      error: query.error,
      retry: query.refetch,
      isAuthenticated: Boolean(user),
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
      can: (permission) => hasPermission(user, permission),
    }),
    [user, query.isPending, query.isError, query.error, query.refetch],
  );
}
