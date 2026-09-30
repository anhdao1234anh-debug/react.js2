import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  // Đọc cả biến không có prefix VITE_ (DEV_*) - chỉ dùng trong file config, không lộ ra client
  const env = loadEnv(mode, ROOT, '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: Number(env.DEV_PORT) || 5173,
      strictPort: true,
      // Proxy /api -> backend: FE & BE cùng origin khi dev => cookie refresh hoạt động, không lo CORS
      proxy: {
        '/api': { target: env.DEV_API_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true },
      },
    },
    preview: { port: Number(env.DEV_PORT) || 5173 },
    build: { sourcemap: mode !== 'production' },
    test: {
      name: 'frontend',
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.test.{js,jsx}'],
      css: false,
      // Env cố định cho test, không phụ thuộc frontend/.env
      env: { VITE_APP_NAME: 'Test App', VITE_API_URL: '/api/v1' },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
        reporter: ['text', 'html', 'lcov'],
      },
    },
  };
});
