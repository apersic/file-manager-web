import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { toast } from "react-toastify";
import { server } from "@/test/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  toast.dismiss();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
