import { Avatar, Badge, Button, Select } from '@/core/components/ui';
import { ROLE_LABELS } from '@/core/constants/rbac';
import { formatDateTime } from '@/core/utils/format';
import { RoleBadge } from './RoleBadge';

/**
 * Bảng người dùng. Nút thao tác chỉ hiện khi user hiện tại có quyền VÀ cấp bậc cao hơn đối tượng.
 */
export function UserTable({
  users,
  currentUserId,
  permissions,
  assignableRoles,
  canManage,
  disabled,
  onToggleActive,
  onChangeRole,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
          <tr>
            <th className="px-4 py-3">Người dùng</th>
            <th className="px-4 py-3">Quyền</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="hidden px-4 py-3 lg:table-cell">Đăng nhập gần nhất</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {users.map((user) => {
            const manageable = canManage(user);
            return (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} src={user.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-1 text-xs text-gray-400">(bạn)</span>
                        )}
                      </p>
                      <p className="truncate text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {permissions.canChangeRole && manageable ? (
                    <Select
                      aria-label={`Quyền của ${user.name}`}
                      value={user.role}
                      disabled={disabled}
                      onChange={(event) => onChangeRole(user, event.target.value)}
                      className="h-8 w-40 py-1"
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <RoleBadge role={user.role} />
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? (
                    <Badge color="green">Hoạt động</Badge>
                  ) : (
                    <Badge color="red">Đã khoá</Badge>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                  {formatDateTime(user.lastLoginAt)}
                </td>
                <td className="px-4 py-3">
                  {manageable && (
                    <div className="flex justify-end gap-2">
                      {permissions.canUpdate && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => onToggleActive(user)}
                        >
                          {user.isActive ? 'Khoá' : 'Mở khoá'}
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button size="sm" variant="danger" onClick={() => onDelete(user)}>
                          Xoá
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
