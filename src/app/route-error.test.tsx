import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AppProvider } from "@/app/provider";
import { routes } from "@/app/router";

vi.mock("@/app/routes/home-page", () => ({
  HomePage: () => {
    throw new Error("render failed");
  },
}));

describe("route error boundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("covers a render failure", () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    render(<AppProvider router={router} />);

    expect(
      screen.getByRole("heading", { name: "This page failed to render" }),
    ).toBeInTheDocument();
  });
});
