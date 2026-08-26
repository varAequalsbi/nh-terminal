import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      gcTime: 10 * 60_000,
      retry: (count, error: any) =>
        error?.response?.status >= 400 && error?.response?.status < 500 ? false : count < 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: { retry: false },
  },
});
