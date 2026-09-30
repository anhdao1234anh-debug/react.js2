import { describe, expect, it, vi } from 'vitest';
import { cn } from '@/core/lib/cn';
import { applyServerErrors, stripEmpty } from './form';
import { formatCurrency, formatDate, formatDateTime, getInitials } from './format';

describe('format', () => {
  it('formatCurrency theo VND', () => {
    expect(formatCurrency(1290000).replace(/\s/g, ' ')).toBe('1.290.000 ₫');
    expect(formatCurrency('abc')).toBe('—');
  });

  it('formatDate / formatDateTime xử lý giá trị rỗng / sai', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime('invalid')).toBe('—');
    expect(formatDate('2026-01-15T00:00:00Z')).toMatch(/2026/);
  });

  it('getInitials', () => {
    expect(getInitials('Nguyễn Văn An')).toBe('NA');
    expect(getInitials('an')).toBe('A');
    expect(getInitials('')).toBe('?');
  });
});

describe('form utils', () => {
  it('applyServerErrors gắn lỗi theo field, báo còn lỗi chưa gắn', () => {
    const setError = vi.fn();
    const error = {
      details: [
        { path: 'email', message: 'Email đã tồn tại' },
        { path: 'token', message: 'Token hỏng' },
      ],
    };
    expect(applyServerErrors(setError, error, ['email', 'password'])).toBe(true);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Email đã tồn tại' });
  });

  it('applyServerErrors trả true khi lỗi không có details', () => {
    expect(applyServerErrors(vi.fn(), { message: 'x' })).toBe(true);
    expect(applyServerErrors(vi.fn(), { details: [{ path: 'a', message: 'b' }] })).toBe(false);
  });

  it('stripEmpty bỏ chuỗi rỗng', () => {
    expect(stripEmpty({ a: '', b: 0, c: 'x', d: undefined })).toEqual({ b: 0, c: 'x' });
  });
});

describe('cn', () => {
  it('gộp class có điều kiện và xử lý xung đột Tailwind', () => {
    const hidden = false;
    expect(cn('px-2 py-1', hidden && 'hidden', 'px-4')).toBe('py-1 px-4');
  });
});
