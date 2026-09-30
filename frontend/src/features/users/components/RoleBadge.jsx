import { Badge } from '@/core/components/ui';
import { ROLE_LABELS, ROLES } from '@/core/constants/rbac';

const COLORS = { [ROLES.SUPER_ADMIN]: 'red', [ROLES.ADMIN]: 'brand', [ROLES.MEMBER]: 'gray' };

export function RoleBadge({ role }) {
  return <Badge color={COLORS[role] ?? 'gray'}>{ROLE_LABELS[role] ?? role}</Badge>;
}
