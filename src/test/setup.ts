import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { toast } from "react-toastify";

afterEach(() => {
  cleanup();
  toast.dismiss();
});
