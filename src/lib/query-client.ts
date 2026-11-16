import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

const maxQueryRetries = 2;

export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= maxQueryRetries) {
    return false;
  }
  if (!isAxiosError(error) || error.code === "ERR_CANCELED") {
    return false;
  }
  const status = error.response?.status;
  if (status === undefined) {
    return true;
  }
  return status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
