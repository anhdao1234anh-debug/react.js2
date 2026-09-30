import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { tokenStore } from '@/core/api/tokenStore';
import { toast } from '@/core/lib/toast';
import { server } from './msw/server';

// Request không có handler => lỗi ngay (tránh test gọi API thật / quên mock)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  tokenStore.clear();
  toast.clear();
});

afterAll(() => server.close());
