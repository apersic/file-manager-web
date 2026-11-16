import { fireEvent, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { catalog, designs, nodeHandlers, toDetail } from "@/test/nodes";
import { renderAt } from "@/test/render-app";
import { server } from "@/test/server";

describe("browse folders", () => {
  test("sends / to the root folder", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/");

    expect(
      await screen.findByRole("heading", { name: "Home" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/folders/1");
    expect(
      await screen.findByRole("link", { name: /Designs/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Photos/ })).toBeInTheDocument();
  });

  test("opens a deep folder without visiting home first", async () => {
    server.use(...nodeHandlers());
    renderAt("/folders/4");

    expect(
      await screen.findByRole("heading", { name: "Designs" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/folders/1",
    );
    expect(await screen.findByText("Notes")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Notes/ }),
    ).not.toBeInTheDocument();
  });

  test("returns through the breadcrumb", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/folders/1");

    fireEvent.click(await screen.findByRole("link", { name: /Designs/ }));
    expect(
      await screen.findByRole("heading", { name: "Designs" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(
      await screen.findByRole("heading", { name: "Home" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/folders/1");
  });

  test("loads the next page with the cursor", async () => {
    const cursors: Array<string | null> = [];
    server.use(
      ...nodeHandlers({
        pageSize: 1,
        onList: (url) => {
          cursors.push(url.searchParams.get("cursor"));
        },
      }),
    );
    renderAt("/folders/1");

    expect(
      await screen.findByRole("link", { name: /Designs/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Photos/ }),
    ).not.toBeInTheDocument();
    expect(cursors).toEqual([null]);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(
      await screen.findByRole("link", { name: /Photos/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Designs/ })).toBeInTheDocument();
    expect(cursors).toEqual([null, "1"]);
  });

  test("shows an empty folder", async () => {
    server.use(...nodeHandlers());
    renderAt("/folders/6");

    expect(
      await screen.findByRole("heading", { name: "Photos" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("This folder is empty."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });

  test("shows a loading state before the folder arrives", async () => {
    server.use(
      http.get("*/api/v1/nodes/:id", async () => {
        await delay(50);
        return HttpResponse.json(toDetail(designs, catalog));
      }),
      ...nodeHandlers(),
    );
    renderAt("/folders/4");

    expect(screen.getByRole("status")).toHaveTextContent("Loading folder");
    expect(
      await screen.findByRole("heading", { name: "Designs" }),
    ).toBeInTheDocument();
  });

  test("shows a missing folder and does not retry a 404", async () => {
    let hits = 0;
    server.use(
      http.get("*/api/v1/nodes/:id", () => {
        hits += 1;
        return HttpResponse.json(
          {
            message: "Not Found",
            status: 404,
            error: "Not Found",
            timestamp: "2026-11-16T12:00:00Z",
            path: "/api/v1/nodes/99",
          },
          { status: 404 },
        );
      }),
    );
    renderAt("/folders/99");

    expect(
      await screen.findByRole("heading", { name: "Folder not found" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(hits).toBe(1);
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(hits).toBe(1);
  });

  test.each(["abc", "0", "01", "-1", "1.5"])(
    "does not request a folder for %s",
    (id) => {
      renderAt(`/folders/${id}`);
      expect(
        screen.getByRole("heading", { name: "Folder not found" }),
      ).toBeInTheDocument();
    },
  );

  test("does not list children of a file", async () => {
    let lists = 0;
    server.use(
      ...nodeHandlers({
        onList: () => {
          lists += 1;
        },
      }),
    );
    renderAt("/folders/5");

    expect(await screen.findByText("This is a file.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Designs" })).toBeInTheDocument();
    expect(lists).toBe(0);
  });

  test("says when home cannot be loaded", async () => {
    server.use(
      http.get("*/api/v1/nodes/root", () =>
        HttpResponse.json(
          {
            message: "Not Found",
            status: 404,
            error: "Not Found",
            timestamp: "2026-11-16T12:00:00Z",
            path: "/api/v1/nodes/root",
          },
          { status: 404 },
        ),
      ),
    );
    const { router } = renderAt("/");

    expect(
      await screen.findByText("Home could not be loaded."),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  test("says when the folder list fails", async () => {
    server.use(
      http.get("*/api/v1/nodes", () =>
        HttpResponse.json(
          {
            message: "Nope",
            status: 500,
            error: "Error",
            timestamp: "2026-11-16T12:00:00Z",
            path: "/api/v1/nodes",
          },
          { status: 500 },
        ),
      ),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");

    expect(
      await screen.findByRole("heading", { name: "Home" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("The folder list could not be loaded."),
    ).toBeInTheDocument();
  });
});
