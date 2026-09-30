// Entry point: kết nối DB -> listen -> tắt êm (graceful shutdown) khi nhận tín hiệu dừng.
import { env } from '#config/env.js';
import { connectDatabase, disconnectDatabase } from '#core/database/mongoose.js';
import { logger } from '#core/logger/logger.js';
import { createApp } from './app.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 ${env.APP_NAME} API chạy tại ${env.API_PUBLIC_URL} (env: ${env.NODE_ENV})`);
  });

  let shuttingDown = false;
  const shutdown = async (signal, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Đang tắt server...');

    const forceExit = setTimeout(() => {
      logger.error('Tắt server quá thời gian, buộc thoát');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async () => {
      await disconnectDatabase().catch((error) => logger.error({ err: error }, 'Lỗi đóng DB'));
      logger.info('Đã tắt server');
      process.exit(exitCode);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    shutdown('uncaughtException', 1);
  });
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Khởi động server thất bại');
  process.exit(1);
});
