import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { describe, expect, test } from "vitest";
import { AppProvider } from "@/app/provider";
import { routes } from "@/app/router";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<AppProvider router={router} />);
}

describe("routes", () => {
  test("home says browsing is not implemented and links to the specification", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { name: "File manager" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Browsing is not implemented yet/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "specification" })).toHaveAttribute(
      "href",
      "/specification.md",
    );
  });

  test("unknown paths render the local 404", () => {
    renderAt("/missing");

    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Back home" }));
    expect(
      screen.getByText(/Browsing is not implemented yet/),
    ).toBeInTheDocument();
  });
});
