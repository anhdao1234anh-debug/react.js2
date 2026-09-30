import mongoose from 'mongoose';
import { env, isProduction } from '#config/env.js';
import { createLogger } from '#core/logger/logger.js';

const log = createLogger('database');

mongoose.set('strictQuery', true);

/** Kết nối MongoDB. Ném lỗi nếu không kết nối được (server.js sẽ dừng process). */
export async function connectDatabase(uri = env.MONGODB_URI) {
  mongoose.connection.on('disconnected', () => log.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => log.info('MongoDB reconnected'));

  await mongoose.connect(uri, {
    // Production: tạo index bằng migration/script, tránh build index tự động lúc khởi động
    autoIndex: !isProduction,
    serverSelectionTimeoutMS: 10_000,
  });
  log.info({ db: mongoose.connection.name }, 'MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  log.info('MongoDB connection closed');
}

/** Trạng thái kết nối cho health check. */
export function getDatabaseStatus() {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return states[mongoose.connection.readyState] ?? 'unknown';
}
