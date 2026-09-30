import { pinoHttp } from 'pino-http';
import { logger } from '#core/logger/logger.js';

/** Log mỗi HTTP request (method, url, status, thời gian xử lý). */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  autoLogging: { ignore: (req) => req.url?.endsWith('/health') },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
