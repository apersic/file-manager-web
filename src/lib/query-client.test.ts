import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, test } from "vitest";
import { createQueryClient, shouldRetryQuery } from "@/lib/query-client";

function httpError(status: number): AxiosError {
  return new AxiosError(
    "Request failed",
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: "Error",
      data: {
        message: "An unexpected error occurred",
        status,
        error: "Internal Server Error",
        timestamp: "2026-11-16T00:00:00Z",
        path: "/api/v1/nodes",
      },
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    },
  );
}

const networkError = new AxiosError("Network Error", "ERR_NETWORK");
const canceledError = new AxiosError("canceled", "ERR_CANCELED");

describe("shouldRetryQuery", () => {
  test("retries network failures and HTTP 500s at most twice", () => {
    expect(shouldRetryQuery(0, networkError)).toBe(true);
    expect(shouldRetryQuery(1, networkError)).toBe(true);
    expect(shouldRetryQuery(2, networkError)).toBe(false);
    expect(shouldRetryQuery(0, httpError(500))).toBe(true);
    expect(shouldRetryQuery(1, httpError(503))).toBe(true);
    expect(shouldRetryQuery(2, httpError(500))).toBe(false);
  });

  test("does not retry other HTTP statuses, cancels, or unknown errors", () => {
    expect(shouldRetryQuery(0, httpError(400))).toBe(false);
    expect(shouldRetryQuery(0, httpError(401))).toBe(false);
    expect(shouldRetryQuery(0, httpError(404))).toBe(false);
    expect(shouldRetryQuery(0, httpError(409))).toBe(false);
    expect(shouldRetryQuery(0, canceledError)).toBe(false);
    expect(shouldRetryQuery(0, new Error("boom"))).toBe(false);
  });
});

describe("query client", () => {
  test("keeps data fresh for 30 seconds", () => {
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBe(
      30_000,
    );
  });

  test("fetches a network failure three times", async () => {
    const client = createQueryClient();
    let attempts = 0;

    await expect(
      client.fetchQuery({
        queryKey: ["network"],
        retryDelay: 0,
        queryFn: () => {
          attempts += 1;
          throw networkError;
        },
      }),
    ).rejects.toBe(networkError);

    expect(attempts).toBe(3);
  });

  test("fetches a 404 once", async () => {
    const client = createQueryClient();
    const missing = httpError(404);
    let attempts = 0;

    await expect(
      client.fetchQuery({
        queryKey: ["missing"],
        retryDelay: 0,
        queryFn: () => {
          attempts += 1;
          throw missing;
        },
      }),
    ).rejects.toBe(missing);

    expect(attempts).toBe(1);
  });

  test("does not retry mutations", async () => {
    const client = createQueryClient();
    let attempts = 0;
    const mutation = client.getMutationCache().build(client, {
      mutationFn: () => {
        attempts += 1;
        return Promise.reject(networkError);
      },
    });

    await expect(mutation.execute(undefined)).rejects.toBe(networkError);
    expect(attempts).toBe(1);
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  });
});
