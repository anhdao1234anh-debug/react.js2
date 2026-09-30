import { QueryState } from '@/core/components/feedback/QueryState';
import { Badge, Button } from '@/core/components/ui';
import { formatDateTime } from '@/core/utils/format';
import { useAccountSessions } from '../hooks/useAccountSessions';

const METHOD_LABELS = {
  password: 'Mật khẩu',
  magic_link: 'Magic link',
  'oauth:google': 'Google',
  'oauth:github': 'GitHub',
};

/** Rút gọn user-agent thành tên trình duyệt dễ đọc. */
function describeDevice(userAgent = '') {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Trình duyệt khác';
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  return [browser, os].filter(Boolean).join(' · ');
}

export function SessionList() {
  const { sessionsQuery, revoke, revokingId, logoutEverywhere, isLoggingOutAll } =
    useAccountSessions();

  return (
    <div className="space-y-4">
      <QueryState query={sessionsQuery} loadingLabel="Đang tải thiết bị...">
        {(sessions) => (
          <ul className="divide-y divide-gray-100 rounded-lg ring-1 ring-gray-200">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {describeDevice(session.userAgent)}{' '}
                    {session.isCurrent && <Badge color="green">Thiết bị này</Badge>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {METHOD_LABELS[session.method] ?? session.method} · IP {session.ip ?? '—'} ·
                    Hoạt động {formatDateTime(session.lastUsedAt)}
                  </p>
                </div>
                {!session.isCurrent && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={revokingId === session.id}
                    onClick={() => revoke(session)}
                  >
                    Đăng xuất
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      <Button variant="danger" loading={isLoggingOutAll} onClick={logoutEverywhere}>
        Đăng xuất khỏi mọi thiết bị
      </Button>
    </div>
  );
}
