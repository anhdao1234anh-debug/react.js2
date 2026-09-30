// Hook điều phối trang quản trị người dùng: dữ liệu + quy tắc phân cấp + hành động.
import { getErrorMessage } from '@/core/api/apiError';
import { PERMISSIONS, canManageUser, getAssignableRoles } from '@/core/constants/rbac';
import { useDisclosure } from '@/core/hooks/useDisclosure';
import { useListParams } from '@/core/hooks/useListParams';
import { toast } from '@/core/lib/toast';
import { useAuth } from '@/features/auth';
import { useDeleteUser, useUpdateUser, useUpdateUserRole, useUsers } from './useUsers';

export function useUserManagement() {
  const { user: currentUser, can } = useAuth();
  const { params, setParams, setPage } = useListParams({
    defaults: { limit: 10, sort: '-createdAt' },
    filters: ['role'],
  });
  const usersQuery = useUsers(params);
  const deleteDialog = useDisclosure();

  const updateUser = useUpdateUser();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const permissions = {
    canUpdate: can(PERMISSIONS.USER_UPDATE),
    canDelete: can(PERMISSIONS.USER_DELETE),
    canChangeRole: can(PERMISSIONS.USER_ROLE_UPDATE),
  };
  const assignableRoles = getAssignableRoles(currentUser?.role);

  /** Có được thao tác trên user này không (cùng quy tắc backend). */
  const canManage = (target) => canManageUser(currentUser, target);

  const run = async (promise, successMessage) => {
    try {
      await promise;
      toast.success(successMessage);
    } catch (error) {
      toast.error('Thao tác thất bại', getErrorMessage(error));
    }
  };

  const toggleActive = (target) =>
    run(
      updateUser.mutateAsync({ id: target.id, data: { isActive: !target.isActive } }),
      target.isActive ? `Đã khoá ${target.name}` : `Đã mở khoá ${target.name}`,
    );

  const changeRole = (target, role) =>
    run(updateRole.mutateAsync({ id: target.id, role }), `Đã đổi quyền của ${target.name}`);

  const confirmDelete = async () => {
    await run(deleteUser.mutateAsync(deleteDialog.data.id), `Đã xoá ${deleteDialog.data.name}`);
    deleteDialog.close();
  };

  return {
    params,
    setParams,
    setPage,
    usersQuery,
    currentUser,
    permissions,
    assignableRoles,
    canManage,
    toggleActive,
    changeRole,
    deleteDialog,
    confirmDelete,
    isMutating: updateUser.isPending || updateRole.isPending,
    isDeleting: deleteUser.isPending,
  };
}
