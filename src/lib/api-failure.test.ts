import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, test } from "vitest";
import { describeFailure, failureMessage } from "@/lib/api-failure";

const envelope = {
  message: "Not Found",
  status: 404,
  error: "Not Found",
  timestamp: "2026-11-16T00:00:00Z",
  path: "/api/v1/missing",
};

function httpError(status: number, data: unknown): AxiosError {
  return new AxiosError(
    "Request failed",
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: "Error",
      data,
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    },
  );
}

describe("describeFailure", () => {
  test("reads the error envelope", () => {
    const failure = describeFailure(httpError(404, envelope));
    expect(failure).toEqual({ kind: "envelope", ...envelope });
    expect(failureMessage(failure)).toBe("Not Found");
  });

  test("reads a validation field map as one message", () => {
    const failure = describeFailure(
      httpError(400, {
        name: "Name is required",
        limit: "Limit must be between 1 and 100",
      }),
    );
    expect(failure.kind).toBe("fields");
    expect(failureMessage(failure)).toBe(
      "name: Name is required; limit: Limit must be between 1 and 100",
    );
  });

  test("does not treat a mixed body as a field map", () => {
    const failure = describeFailure(
      httpError(400, { name: "Name is required", limit: 101 }),
    );
    expect(failure).toEqual({ kind: "http", status: 400 });
    expect(failureMessage(failure)).toBe("Request failed (400)");
  });

  test("treats a response without a body as HTTP status text", () => {
    const failure = describeFailure(httpError(500, ""));
    expect(failure).toEqual({ kind: "http", status: 500 });
  });

  test("treats a missing response as a network failure", () => {
    const failure = describeFailure(
      new AxiosError("Network Error", "ERR_NETWORK"),
    );
    expect(failure).toEqual({ kind: "network" });
    expect(failureMessage(failure)).toBe("Network request failed");
  });

  test("marks a canceled request", () => {
    const failure = describeFailure(new AxiosError("canceled", "ERR_CANCELED"));
    expect(failure).toEqual({ kind: "canceled" });
  });

  test("uses a generic message for a non-HTTP error", () => {
    const failure = describeFailure(new Error("boom"));
    expect(failure).toEqual({ kind: "unknown" });
    expect(failureMessage(failure)).toBe("Request failed");
  });
});
