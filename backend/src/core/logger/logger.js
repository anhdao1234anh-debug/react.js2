import pino from 'pino';
import { env, isDevelopment } from '#config/env.js';

/**
 * Logger dùng chung (pino - JSON log, hiệu năng cao).
 * - Development: pretty print cho dễ đọc.
 * - Production: JSON thuần để đẩy vào hệ thống log (Loki, ELK, CloudWatch...).
 * - Tự che (redact) các trường nhạy cảm.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: env.APP_NAME },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,app' },
      }
    : undefined,
});

/** Tạo logger con gắn nhãn module, vd: createLogger('auth'). */
export const createLogger = (module) => logger.child({ module });
