import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { api, app } from '#tests/helpers.js';

describe('Health & app shell', () => {
  it('GET /api/v1/health trả về ok khi DB đã kết nối', async () => {
    const res = await request(app).get(api('/health')).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.services.database).toBe('connected');
  });

  it('GET / trả về thông tin app', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body.data.api).toBe('/api/v1');
  });

  it('gắn X-Request-Id vào mọi response và giữ lại id hợp lệ từ client', async () => {
    const generated = await request(app).get(api('/health'));
    expect(generated.headers['x-request-id']).toMatch(/^[\w-]{10,}$/);

    const reused = await request(app).get(api('/health')).set('X-Request-Id', 'client-id-123');
    expect(reused.headers['x-request-id']).toBe('client-id-123');
  });

  it('route không tồn tại -> 404 ROUTE_NOT_FOUND', async () => {
    const res = await request(app).get(api('/khong-ton-tai')).expect(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'ROUTE_NOT_FOUND' } });
    expect(res.body.requestId).toBeTruthy();
  });

  it('body JSON sai cú pháp -> 400 INVALID_JSON', async () => {
    const res = await request(app)
      .post(api('/auth/login'))
      .set('Content-Type', 'application/json')
      .send('{"email": ')
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('CORS chỉ cho phép origin trong CORS_ORIGINS', async () => {
    const allowed = await request(app).get(api('/health')).set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const blocked = await request(app).get(api('/health')).set('Origin', 'https://evil.com');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('bật các security header của helmet', async () => {
    const res = await request(app).get(api('/health'));
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
