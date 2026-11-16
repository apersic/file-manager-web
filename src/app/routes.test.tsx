import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { nodeHandlers } from "@/test/nodes";
import { renderAt } from "@/test/render-app";
import { server } from "@/test/server";

describe("routes", () => {
  test("unknown paths render the local 404", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/missing");

    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Back home" }));
    expect(
      await screen.findByRole("heading", { name: "Home" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/folders/1");
  });
});
