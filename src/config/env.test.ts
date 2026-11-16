import { describe, expect, test } from "vitest";
import { env, normalizeApiUrl, readApiUrl } from "@/config/env";

describe("readApiUrl", () => {
  test("uses the dev API when the variable is missing", () => {
    expect(readApiUrl(undefined)).toBe("http://localhost:8080");
    expect(readApiUrl("")).toBe("http://localhost:8080");
  });

  test("strips trailing slashes", () => {
    expect(readApiUrl("http://localhost:9090/")).toBe("http://localhost:9090");
    expect(normalizeApiUrl("http://localhost:9090///")).toBe(
      "http://localhost:9090",
    );
  });

  test("rejects a blank or non-string value", () => {
    expect(() => readApiUrl("   ")).toThrow(/must not be blank/);
    expect(() => readApiUrl(8080)).toThrow(/must be a string/);
  });
});

describe("env", () => {
  test("reads VITE_API_URL", () => {
    expect(env.apiUrl).toBe("http://127.0.0.1:8080");
  });
});
