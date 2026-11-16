import { render } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { AppProvider } from "@/app/provider";
import { routes } from "@/app/router";
import { createQueryClient, shouldRetryQuery } from "@/lib/query-client";

export function renderAt(path: string) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      retryDelay: 0,
    },
    mutations: {
      retry: false,
    },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<AppProvider router={router} queryClient={queryClient} />);
  return { router };
}
