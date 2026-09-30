import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Toaster } from '@/core/components/feedback/Toaster';
import { env } from '@/core/config/env';
import { queryClient as defaultQueryClient } from '@/core/lib/queryClient';
import { AuthSync } from '@/features/auth';

// Devtools chỉ tải khi bật bằng env -> không làm nặng bundle production
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  })),
);

/** Toàn bộ provider của app. Test truyền queryClient riêng để cô lập cache. */
export function AppProviders({ children, queryClient = defaultQueryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {children}
      <Toaster />
      {env.enableQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
