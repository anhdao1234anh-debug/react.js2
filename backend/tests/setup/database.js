// Chạy trước MỖI file test: mỗi file dùng một database riêng -> chạy song song không đụng nhau.
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';
import { clearMailOutbox } from '#core/mail/mailer.js';

beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName: `test_${randomUUID().slice(0, 8)}` });
  // Đảm bảo unique index đã tạo xong trước khi test (vd trùng email)
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).createIndexes()));
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  clearMailOutbox();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
