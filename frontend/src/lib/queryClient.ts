import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/**
 * Defaults from PROJECT_MASTER.md section 10.
 *
 * The retry rule matters most: a 4xx is a decision the server already made
 * (validation failed, conflict, not found, unauthorized). Retrying it wastes a
 * round trip and, on rate-limited endpoints, actively makes things worse.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
