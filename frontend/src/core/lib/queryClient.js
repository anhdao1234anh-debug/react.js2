import { QueryClient } from '@tanstack/react-query';

/** Không retry với lỗi phía client (4xx) - retry cũng không thành công. */
function shouldRetry(failureCount, error) {
  const status = error?.status;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();
