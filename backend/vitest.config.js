import { defineConfig } from 'vitest/config';

// Env cố định cho test (không đọc backend/.env) -> test chạy giống nhau trên mọi máy / CI.
const TEST_ENV = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  APP_NAME: 'Test App',
  API_PUBLIC_URL: 'http://localhost:8000',
  FRONTEND_URL: 'http://localhost:5173',
  CORS_ORIGINS: 'http://localhost:5173',
  // URI thật được inject từ MongoMemoryServer (tests/setup/globalSetup.js)
  MONGODB_URI: 'mongodb://127.0.0.1:27017/placeholder',
  JWT_ACCESS_SECRET: 'test-access-secret-at-least-32-characters-long',
  JWT_ACCESS_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  COOKIE_SECRET: 'test-cookie-secret-at-least-32-characters-long',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'lax',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  GITHUB_CLIENT_ID: 'github-client-id',
  GITHUB_CLIENT_SECRET: 'github-client-secret',
  MAIL_DRIVER: 'memory',
  RATE_LIMIT_MAX: '100000',
  AUTH_RATE_LIMIT_MAX: '100000',
};

export default defineConfig({
  test: {
    name: 'backend',
    environment: 'node',
    env: TEST_ENV,
    include: ['tests/**/*.test.js'],
    globalSetup: ['./tests/setup/globalSetup.js'],
    setupFiles: ['./tests/setup/database.js'],
    // Lần đầu MongoMemoryServer cần tải binary MongoDB (vài chục MB)
    hookTimeout: 120_000,
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/scripts/seed.js'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: { lines: 85, functions: 85, statements: 85, branches: 75 },
    },
  },
});
