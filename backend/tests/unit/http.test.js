import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError } from '#core/errors/AppError.js';
import { asyncHandler, asyncHandlers } from '#core/http/asyncHandler.js';
import { createModulesRouter, defineModule } from '#core/http/defineModule.js';
import { sendCreated, sendNoContent, sendPaginated } from '#core/http/response.js';
import { errorHandler, normalizeError } from '#core/middlewares/errorHandler.js';
import { createRateLimiter } from '#core/middlewares/rateLimiter.js';
import { validate } from '#core/middlewares/validate.js';

/** App mini để test từng middleware độc lập. */
function buildApp(register) {
  const app = express();
  app.use(express.json());
  register(app);
  app.use(errorHandler);
  return app;
}

describe('AppError factories', () => {
  it.each([
    [AppError.badRequest(), 400, 'BAD_REQUEST'],
    [AppError.validation([]), 422, 'VALIDATION_ERROR'],
    [AppError.unauthorized(), 401, 'UNAUTHORIZED'],
    [AppError.forbidden(), 403, 'FORBIDDEN'],
    [AppError.notFound('Sản phẩm'), 404, 'NOT_FOUND'],
    [AppError.conflict(), 409, 'CONFLICT'],
    [AppError.tooManyRequests(), 429, 'TOO_MANY_REQUESTS'],
    [AppError.internal(), 500, 'INTERNAL_ERROR'],
  ])('%o -> %i %s', (error, status, code) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(status);
    expect(error.code).toBe(code);
  });

  it('notFound ghép tên tài nguyên vào message', () => {
    expect(AppError.notFound('Sản phẩm').message).toBe('Sản phẩm không tồn tại');
  });
});

describe('normalizeError', () => {
  it('chuyển ZodError -> 422', () => {
    const result = z.object({ a: z.string() }).safeParse({ a: 1 });
    const error = normalizeError(result.error);
    expect(error.statusCode).toBe(422);
    expect(error.details[0]).toMatchObject({ path: 'a', location: 'body' });
  });

  it('chuyển lỗi Mongoose / Mongo', () => {
    const cast = new mongoose.Error.CastError('ObjectId', 'abc', '_id');
    expect(normalizeError(cast)).toMatchObject({ statusCode: 400 });

    const validation = new mongoose.Error.ValidationError();
    validation.addError(
      'title',
      new mongoose.Error.ValidatorError({ path: 'title', message: 'required' }),
    );
    expect(normalizeError(validation)).toMatchObject({ statusCode: 422 });

    const duplicate = Object.assign(new Error('E11000'), { code: 11000, keyValue: { email: 'a' } });
    expect(normalizeError(duplicate)).toMatchObject({
      statusCode: 409,
      details: { fields: ['email'] },
    });
  });

  it('chuyển lỗi JWT và body-parser', () => {
    expect(normalizeError(new jwt.TokenExpiredError('expired', new Date()))).toMatchObject({
      code: 'TOKEN_EXPIRED',
    });
    expect(normalizeError(new jwt.JsonWebTokenError('bad'))).toMatchObject({
      code: 'INVALID_TOKEN',
    });
    expect(normalizeError({ type: 'entity.too.large' })).toMatchObject({ statusCode: 413 });
  });

  it('lỗi không xác định -> 500 và giữ cause', () => {
    const original = new Error('boom');
    const error = normalizeError(original);
    expect(error.statusCode).toBe(500);
    expect(error.cause).toBe(original);
  });
});

describe('asyncHandler', () => {
  it('chuyển lỗi async và lỗi sync tới next()', async () => {
    const next = vi.fn();
    await asyncHandler(async () => {
      throw new Error('async');
    })({}, {}, next);
    asyncHandler(() => {
      throw new Error('sync');
    })({}, {}, next);
    expect(next.mock.calls.map(([error]) => error.message)).toEqual(['async', 'sync']);
  });

  it('asyncHandlers bọc toàn bộ method', () => {
    const wrapped = asyncHandlers({ a: async () => {}, b: async () => {} });
    expect(Object.keys(wrapped)).toEqual(['a', 'b']);
  });
});

describe('validate middleware', () => {
  const app = buildApp((instance) => {
    instance.post(
      '/items/:id',
      validate({
        params: z.object({ id: z.string().regex(/^\d+$/) }),
        query: z.object({ page: z.coerce.number().default(1) }),
        body: z.object({ name: z.string().trim().min(2) }),
      }),
      (req, res) =>
        res.json({
          params: req.params,
          query: req.query,
          body: req.body,
          validated: req.validated,
        }),
    );
  });

  it('ghi đè dữ liệu đã parse (coerce/trim/default) vào req', async () => {
    const res = await request(app).post('/items/5?page=2').send({ name: '  Laptop ' }).expect(200);
    expect(res.body.query).toEqual({ page: 2 });
    expect(res.body.body).toEqual({ name: 'Laptop' });
    expect(res.body.validated.params).toEqual({ id: '5' });
  });

  it('gom lỗi của params/query/body thành 422', async () => {
    const res = await request(app).post('/items/abc?page=x').send({ name: 'a' }).expect(422);
    const locations = res.body.error.details.map((item) => item.location);
    expect(locations).toEqual(expect.arrayContaining(['params', 'query', 'body']));
  });
});

describe('errorHandler', () => {
  it('ẩn chi tiết lỗi 500 nhưng trả debug ở môi trường không phải production', async () => {
    const app = buildApp((instance) => {
      instance.get('/boom', () => {
        throw new Error('secret db error');
      });
    });
    const res = await request(app).get('/boom').expect(500);
    expect(res.body.error.message).not.toContain('secret');
    expect(res.body.error.debug.message).toBe('secret db error');
  });
});

describe('response helpers', () => {
  it('sendCreated / sendPaginated / sendNoContent', async () => {
    const app = buildApp((instance) => {
      instance.post('/c', (_req, res) => sendCreated(res, { id: 1 }));
      instance.get('/p', (_req, res) => sendPaginated(res, { items: [1], meta: { page: 1 } }));
      instance.delete('/d', (_req, res) => sendNoContent(res));
    });
    const created = await request(app).post('/c').expect(201);
    expect(created.body).toMatchObject({ success: true, data: { id: 1 } });
    const paginated = await request(app).get('/p').expect(200);
    expect(paginated.body).toMatchObject({ data: [1], meta: { page: 1 } });
    await request(app).delete('/d').expect(204);
  });
});

describe('rate limiter', () => {
  it('trả 429 TOO_MANY_REQUESTS khi vượt giới hạn', async () => {
    const app = buildApp((instance) => {
      instance.get('/limited', createRateLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) =>
        res.json({ ok: true }),
      );
    });
    await request(app).get('/limited').expect(200);
    await request(app).get('/limited').expect(200);
    const res = await request(app).get('/limited').expect(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});

describe('defineModule', () => {
  it('validate khai báo module', () => {
    expect(() => defineModule({ name: 'x', basePath: 'no-slash', router: Router() })).toThrow();
  });

  it('không cho trùng basePath', () => {
    const a = defineModule({ name: 'a', basePath: '/a', router: Router() });
    const b = defineModule({ name: 'b', basePath: '/a', router: Router() });
    expect(() => createModulesRouter([a, b])).toThrow(/Trùng basePath/);
  });
});
