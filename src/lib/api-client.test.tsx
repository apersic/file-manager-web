import {
  AxiosError,
  AxiosHeaders,
  isAxiosError,
  type AxiosAdapter,
} from "axios";
import { render, screen } from "@testing-library/react";
import { ToastContainer } from "react-toastify";
import { describe, expect, test } from "vitest";
import { createApiClient } from "@/lib/api-client";

const envelope = {
  message: "Not Found",
  status: 404,
  error: "Not Found",
  timestamp: "2026-11-16T00:00:00Z",
  path: "/api/v1/missing",
};

function respond(data: unknown): AxiosAdapter {
  return (config) =>
    Promise.resolve({
      data,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    });
}

function fail(status: number, data: unknown): AxiosAdapter {
  return (config) =>
    Promise.reject(
      new AxiosError("Request failed", String(status), config, undefined, {
        data,
        status,
        statusText: "Error",
        headers: new AxiosHeaders(),
        config,
      }),
    );
}

function renderToasts() {
  render(<ToastContainer />);
}

describe("api client", () => {
  test("returns the response body", async () => {
    const client = createApiClient({
      baseURL: "http://localhost:8080/",
      adapter: respond({ status: "UP" }),
    });
    renderToasts();

    const body = await client.get<{ status: string }>("/actuator/health");

    expect(body).toEqual({ status: "UP" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows one toast for an error envelope", async () => {
    const client = createApiClient({
      baseURL: "http://localhost:8080",
      adapter: fail(404, envelope),
    });
    renderToasts();

    await expect(client.get("/missing")).rejects.toSatisfy(isAxiosError);
    expect(await screen.findByRole("alert")).toHaveTextContent("Not Found");
  });

  test("shows one toast for a validation field map", async () => {
    const client = createApiClient({
      baseURL: "http://localhost:8080",
      adapter: fail(400, {
        name: "Name is required",
        limit: "Limit must be between 1 and 100",
      }),
    });
    renderToasts();

    await expect(client.post("/api/v1/nodes", { name: "" })).rejects.toSatisfy(
      (error: unknown) => {
        return isAxiosError(error) && error.response?.status === 400;
      },
    );
    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(
      "name: Name is required; limit: Limit must be between 1 and 100",
    );
  });

  test("does not redirect on 401", async () => {
    const client = createApiClient({
      baseURL: "http://localhost:8080",
      adapter: fail(401, {
        message: "Unauthorized",
        status: 401,
        error: "Unauthorized",
        timestamp: "2026-11-16T00:00:00Z",
        path: "/api/v1/nodes",
      }),
    });
    renderToasts();
    const href = window.location.href;

    await expect(client.get("/secure")).rejects.toSatisfy(isAxiosError);

    expect(window.location.href).toBe(href);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
  });

  test("shows one toast for a network failure", async () => {
    const client = createApiClient({
      baseURL: "http://localhost:8080",
      adapter: (config) =>
        Promise.reject(new AxiosError("Network Error", "ERR_NETWORK", config)),
    });
    renderToasts();

    await expect(client.delete("/api/v1/nodes/4")).rejects.toSatisfy(
      isAxiosError,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network request failed",
    );
  });

  test("does not toast a canceled request", async () => {
    const client = createApiClient({
      baseURL: "http://localhost:8080",
      adapter: (config) =>
        Promise.reject(new AxiosError("canceled", "ERR_CANCELED", config)),
    });
    renderToasts();

    await expect(client.get("/slow")).rejects.toSatisfy(isAxiosError);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
