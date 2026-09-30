// Khởi tạo Express app (KHÔNG listen) -> test dùng trực tiếp với supertest.
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { API_PREFIX } from '#config/constants.js';
import { env } from '#config/env.js';
import { createModulesRouter } from '#core/http/defineModule.js';
import { errorHandler } from '#core/middlewares/errorHandler.js';
import { httpLogger } from '#core/middlewares/httpLogger.js';
import { notFound } from '#core/middlewares/notFound.js';
import { apiRateLimiter } from '#core/middlewares/rateLimiter.js';
import { requestId } from '#core/middlewares/requestId.js';
import { modules as defaultModules } from '#modules/index.js';

/** Cho phép origin trong CORS_ORIGINS; request không có Origin (curl, server-to-server) được qua. */
const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  exposedHeaders: ['X-Request-Id'],
};

/**
 * @param {{ modules?: ReturnType<typeof import('#core/http/defineModule.js').defineModule>[] }} [options]
 */
export function createApp({ modules = defaultModules } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  // ----- Middleware nền -----
  app.use(requestId);
  app.use(httpLogger);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // ----- Routes -----
  app.get('/', (_req, res) => {
    res.json({ success: true, data: { name: env.APP_NAME, api: API_PREFIX } });
  });
  app.use(API_PREFIX, apiRateLimiter, createModulesRouter(modules));

  // ----- Xử lý lỗi (luôn ở cuối) -----
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
