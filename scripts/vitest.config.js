import { defineConfig } from 'vitest/config';

// Test cho các script ở root (quản lý env...).
export default defineConfig({
  test: {
    name: 'scripts',
    root: import.meta.dirname,
    include: ['**/*.test.js'],
    environment: 'node',
  },
});
