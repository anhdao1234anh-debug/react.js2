import { Router } from 'express';
import { env } from '#config/env.js';
import { getDatabaseStatus } from '#core/database/mongoose.js';
import { defineModule } from '#core/http/defineModule.js';

const router = Router();

/** Health check cho load balancer / uptime monitor. 503 khi DB mất kết nối. */
router.get('/', (_req, res) => {
  const database = getDatabaseStatus();
  const healthy = database === 'connected';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'ok' : 'degraded',
      app: env.APP_NAME,
      env: env.NODE_ENV,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      services: { database },
    },
  });
});

export const healthModule = defineModule({ name: 'health', basePath: '/health', router });
