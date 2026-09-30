import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiUrl, fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { ApiError, getErrorMessage, toApiError } from './apiError';
import { AUTH_EVENTS, authEvents, httpClient, refreshSession, unwrap } from './httpClient';
import { tokenStore } from './tokenStore';

describe('tokenStore', () => {
  it('lưu trong bộ nhớ và báo cho subscriber', () => {
    const listener = vi.fn();
    const unsubscribe = tokenStore.subscribe(listener);
    tokenStore.set('abc');
    expect(tokenStore.get()).toBe('abc');
    tokenStore.clear();
    expect(listener.mock.calls).toEqual([['abc'], [null]]);
    unsubscribe();
    tokenStore.set('x');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('toApiError', () => {
  it('chuẩn hoá lỗi response từ backend', () => {
    const error = toApiError({
      response: {
        status: 422,
        data: {
          error: { code: 'VALIDATION_ERROR', message: 'Sai', details: [1] },
          requestId: 'r1',
        },
      },
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: [1],
      requestId: 'r1',
    });
  });

  it('dùng message mặc định theo status, lỗi mạng và timeout', () => {
    expect(toApiError({ response: { status: 403, data: {} } }).message).toMatch(/không có quyền/);
    expect(toApiError({ code: 'ECONNABORTED' }).code).toBe('TIMEOUT');
    expect(toApiError(new Error('Network Error'))).toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
    const existing = new ApiError({ message: 'x' });
    expect(toApiError(existing)).toBe(existing);
  });

  it('getErrorMessage', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });
});

describe('httpClient', () => {
  it('gắn Bearer token vào request', async () => {
    let authorization;
    server.use(
      http.get(apiUrl('/secure'), ({ request }) => {
        authorization = request.headers.get('authorization');
        return ok({ fine: true });
      }),
    );
    tokenStore.set('token-1');
    await expect(httpClient.get('/secure').then(unwrap)).resolves.toEqual({ fine: true });
    expect(authorization).toBe('Bearer token-1');
  });

  it('401 -> tự refresh 1 lần duy nhất cho nhiều request song song rồi gửi lại', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return ok({ accessToken: 'fresh-token', user: { id: 'u1' } });
      }),
      http.get(apiUrl('/secure'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer fresh-token'
          ? ok('secret')
          : fail(401, 'TOKEN_EXPIRED'),
      ),
    );
    tokenStore.set('expired-token');

    const results = await Promise.all([
      httpClient.get('/secure').then(unwrap),
      httpClient.get('/secure').then(unwrap),
      httpClient.get('/secure').then(unwrap),
    ]);
    expect(results).toEqual(['secret', 'secret', 'secret']);
    expect(refreshCalls).toBe(1);
    expect(tokenStore.get()).toBe('fresh-token');
  });

  it('refresh thất bại -> xoá token, phát sự kiện UNAUTHORIZED', async () => {
    server.use(http.get(apiUrl('/secure'), () => fail(401, 'TOKEN_EXPIRED')));
    const onUnauthorized = vi.fn();
    authEvents.addEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
    tokenStore.set('expired');

    await expect(httpClient.get('/secure')).rejects.toMatchObject({ status: 401 });
    expect(tokenStore.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    authEvents.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
  });

  it('request có skipAuthRefresh không tự refresh (vd login sai mật khẩu)', async () => {
    const refresh = vi.fn(() => ok({ accessToken: 'x' }));
    server.use(
      http.post(apiUrl('/auth/refresh'), refresh),
      http.post(apiUrl('/auth/login'), () => fail(401, 'INVALID_CREDENTIALS', 'Sai mật khẩu')),
    );
    await expect(
      httpClient.post('/auth/login', {}, { skipAuthRefresh: true }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', message: 'Sai mật khẩu' });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('lỗi không phải 401 được chuẩn hoá thành ApiError', async () => {
    server.use(http.get(apiUrl('/boom'), () => fail(500, 'INTERNAL_ERROR', 'Lỗi máy chủ')));
    await expect(httpClient.get('/boom')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  });

  it('lỗi mạng -> NETWORK_ERROR', async () => {
    server.use(http.get(apiUrl('/offline'), () => HttpResponse.error()));
    await expect(httpClient.get('/offline')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('refreshSession lưu token mới', async () => {
    server.use(
      http.post(apiUrl('/auth/refresh'), () => ok({ accessToken: 'new', user: { id: 'u' } })),
    );
    await expect(refreshSession()).resolves.toMatchObject({ user: { id: 'u' } });
    expect(tokenStore.get()).toBe('new');
  });
});
