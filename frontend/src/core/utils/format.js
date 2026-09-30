const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' });

/** 1290000 -> "1.290.000 ₫" */
export function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? currencyFormatter.format(number) : '—';
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

/** "Nguyễn Văn An" -> "NA" (dùng cho avatar chữ). */
export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts.at(-1)[0] : '';
  return `${first}${last}`.toUpperCase();
}
