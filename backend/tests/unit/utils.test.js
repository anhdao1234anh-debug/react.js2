import { describe, expect, it } from 'vitest';
import { addDuration, parseDuration } from '#core/utils/duration.js';
import { compact, omit, pick } from '#core/utils/object.js';
import { buildPaginationMeta, normalizePagination } from '#core/utils/pagination.js';
import { parseSort, sortPattern } from '#core/utils/sort.js';
import { containsRegex, escapeRegex, nameFromEmail } from '#core/utils/string.js';
import { buildUrl, sanitizeRedirectPath } from '#core/utils/url.js';

describe('duration', () => {
  it.each([
    ['500ms', 500],
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['7d', 604_800_000],
    ['1w', 604_800_000],
  ])('parseDuration(%s) = %i', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it('chấp nhận số và từ chối định dạng sai', () => {
    expect(parseDuration(1000)).toBe(1000);
    expect(() => parseDuration('abc')).toThrow(/không hợp lệ/);
  });

  it('addDuration cộng thời gian từ mốc cho trước', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    expect(addDuration('1h', from).toISOString()).toBe('2026-01-01T01:00:00.000Z');
  });
});

describe('pagination', () => {
  it('chuẩn hoá page/limit và tính skip', () => {
    expect(normalizePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
    expect(normalizePagination({ page: -1, limit: 9999 })).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
    });
    expect(normalizePagination()).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('build meta', () => {
    expect(buildPaginationMeta({ page: 2, limit: 10, total: 25 })).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
    expect(buildPaginationMeta({ page: 1, limit: 10, total: 0 }).totalPages).toBe(1);
  });
});

describe('sort', () => {
  it('parse chuỗi sort theo whitelist', () => {
    expect(parseSort('-price,title', ['price', 'title'])).toEqual({ price: -1, title: 1 });
    expect(parseSort('password', ['price'])).toEqual({ createdAt: -1 });
    expect(parseSort(undefined, ['price'], { title: 1 })).toEqual({ title: 1 });
  });

  it('sortPattern chỉ khớp field hợp lệ', () => {
    const pattern = sortPattern(['price', 'title']);
    expect(pattern.test('-price,title')).toBe(true);
    expect(pattern.test('price,secret')).toBe(false);
  });
});

describe('object', () => {
  it('pick / omit / compact', () => {
    const source = { a: 1, b: undefined, c: 3 };
    expect(pick(source, ['a', 'b'])).toEqual({ a: 1 });
    expect(omit(source, ['a'])).toEqual({ b: undefined, c: 3 });
    expect(compact(source)).toEqual({ a: 1, c: 3 });
  });
});

describe('string', () => {
  it('escape ký tự regex đặc biệt', () => {
    expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
    expect(containsRegex(' (Phone) ').test('my (phone) case')).toBe(true);
  });

  it('tạo tên từ email', () => {
    expect(nameFromEmail('nguyen.van.a@example.com')).toBe('nguyen.van.a');
  });
});

describe('url', () => {
  it('buildUrl giữ sub-path và bỏ query rỗng', () => {
    expect(buildUrl('https://x.com/app', '/login', { token: 'abc', empty: '' })).toBe(
      'https://x.com/app/login?token=abc',
    );
    expect(buildUrl('https://x.com/oauth/authorize', '', { a: '1' })).toBe(
      'https://x.com/oauth/authorize?a=1',
    );
  });

  it('sanitizeRedirectPath chặn open redirect', () => {
    expect(sanitizeRedirectPath('/dashboard?tab=1')).toBe('/dashboard?tab=1');
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/');
    expect(sanitizeRedirectPath('//evil.com')).toBe('/');
    expect(sanitizeRedirectPath('/\\evil.com')).toBe('/');
    expect(sanitizeRedirectPath(undefined, null)).toBeNull();
  });
});
