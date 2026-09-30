import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patchSessionUser } from '@/features/auth';
import { usersApi } from '../api/usersApi';
import { userKeys } from '../userKeys';

export function useUsers(params) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Mutation cập nhật 1 user -> làm mới danh sách. */
function useUserMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export const useUpdateUser = () => useUserMutation(({ id, data }) => usersApi.update(id, data));
export const useUpdateUserRole = () =>
  useUserMutation(({ id, role }) => usersApi.updateRole(id, role));
export const useDeleteUser = () => useUserMutation((id) => usersApi.remove(id));

/** Cập nhật hồ sơ của chính mình -> đồng bộ luôn vào phiên đăng nhập. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (user) => patchSessionUser(queryClient, user),
  });
}
