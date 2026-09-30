import { QueryState } from '@/core/components/feedback/QueryState';
import {
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Pagination,
} from '@/core/components/ui';
import { UserFilters } from '../components/UserFilters';
import { UserTable } from '../components/UserTable';
import { useUserManagement } from '../hooks/useUserManagement';

export default function UsersPage() {
  const management = useUserManagement();
  const { params, setParams, setPage, usersQuery, deleteDialog } = management;

  return (
    <Card>
      <CardHeader
        title="Quản lý người dùng"
        description="Bạn chỉ thao tác được trên tài khoản có cấp bậc thấp hơn mình."
      />
      <CardBody className="space-y-4">
        <UserFilters params={params} onChange={setParams} />
        <QueryState query={usersQuery} loadingLabel="Đang tải người dùng...">
          {({ items, meta }) =>
            items.length === 0 ? (
              <EmptyState title="Không có người dùng phù hợp" />
            ) : (
              <>
                <UserTable
                  users={items}
                  currentUserId={management.currentUser?.id}
                  permissions={management.permissions}
                  assignableRoles={management.assignableRoles}
                  canManage={management.canManage}
                  disabled={management.isMutating}
                  onToggleActive={management.toggleActive}
                  onChangeRole={management.changeRole}
                  onDelete={deleteDialog.open}
                />
                <Pagination meta={meta} onPageChange={setPage} />
              </>
            )
          }
        </QueryState>
      </CardBody>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title="Xoá người dùng?"
        description={`Tài khoản ${deleteDialog.data?.email} sẽ bị xoá vĩnh viễn.`}
        confirmText="Xoá"
        loading={management.isDeleting}
        onConfirm={management.confirmDelete}
        onClose={deleteDialog.close}
      />
    </Card>
  );
}
