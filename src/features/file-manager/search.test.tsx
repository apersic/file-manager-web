import { fireEvent, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import {
  catalog,
  designs,
  photos,
  type CatalogNode,
  nodeHandlers,
} from "@/test/nodes";
import { renderAt } from "@/test/render-app";
import { server } from "@/test/server";

const createdAt = "2026-11-16T12:00:00Z";

function summary(node: CatalogNode) {
  return {
    id: node.id,
    parentId: node.parentId,
    kind: node.kind,
    name: node.name,
    createdAt,
    updatedAt: createdAt,
  };
}

describe("search", () => {
  test("suggests prefix matches after a pause and keeps the typed case", async () => {
    const seen: URL[] = [];
    server.use(...nodeHandlers({ onSearch: (url) => seen.push(url) }));
    renderAt("/folders/1");

    fireEvent.change(
      await screen.findByRole("combobox", { name: "Search this folder" }),
      { target: { value: "des" } },
    );
    expect(seen).toEqual([]);

    expect(
      await screen.findByRole("option", { name: /Designs/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Photos/ }),
    ).not.toBeInTheDocument();
    expect(seen).toHaveLength(1);
    expect(seen[0]?.searchParams.get("q")).toBe("des");
    expect(seen[0]?.searchParams.get("match")).toBe("PREFIX");
    expect(seen[0]?.searchParams.get("limit")).toBe("10");
    expect(seen[0]?.searchParams.get("parentId")).toBe("1");
  });

  test("does not search a blank box", async () => {
    let hits = 0;
    server.use(
      ...nodeHandlers({
        onSearch: () => {
          hits += 1;
        },
      }),
    );
    renderAt("/folders/1");
    fireEvent.change(
      await screen.findByRole("combobox", { name: "Search this folder" }),
      { target: { value: "   " } },
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    expect(hits).toBe(0);
  });

  test("treats % and _ as letters", async () => {
    const seen: URL[] = [];
    const percent: CatalogNode = {
      id: 20,
      parentId: 1,
      kind: "FILE",
      name: "100%done",
    };
    const otherPercent: CatalogNode = {
      id: 21,
      parentId: 1,
      kind: "FILE",
      name: "100Xdone",
    };
    const underscore: CatalogNode = {
      id: 22,
      parentId: 1,
      kind: "FILE",
      name: "a_c",
    };
    const letters: CatalogNode = {
      id: 23,
      parentId: 1,
      kind: "FILE",
      name: "abc",
    };
    server.use(
      ...nodeHandlers({
        nodes: [...catalog, percent, otherPercent, underscore, letters],
        onSearch: (url) => seen.push(url),
      }),
    );
    renderAt("/folders/1");
    const box = await screen.findByRole("combobox", {
      name: "Search this folder",
    });

    fireEvent.change(box, { target: { value: "100%" } });
    expect(
      await screen.findByRole("option", { name: /100%done/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /100Xdone/ }),
    ).not.toBeInTheDocument();

    fireEvent.change(box, { target: { value: "a_c" } });
    expect(
      await screen.findByRole("option", { name: /a_c/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /abc/ }),
    ).not.toBeInTheDocument();
    expect(seen.map((url) => url.searchParams.get("q"))).toEqual([
      "100%",
      "a_c",
    ]);
  });

  test("keeps a newer suggestion when an older one arrives late", async () => {
    server.use(
      http.get("*/api/v1/nodes/search", async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q");
        if (q === "des") {
          await delay(400);
          return HttpResponse.json({
            items: [summary(designs)],
            nextCursor: null,
          });
        }
        return HttpResponse.json({
          items: [summary(photos)],
          nextCursor: null,
        });
      }),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");
    const box = await screen.findByRole("combobox", {
      name: "Search this folder",
    });

    fireEvent.change(box, { target: { value: "des" } });
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Searching");
    });
    fireEvent.change(box, { target: { value: "pho" } });

    expect(
      await screen.findByRole("option", { name: /Photos/ }),
    ).toBeInTheDocument();
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
    expect(
      screen.queryByRole("option", { name: /Designs/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Photos/ })).toBeInTheDocument();
  });

  test("opens the parent folder from a suggestion", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/folders/4");

    fireEvent.change(
      await screen.findByRole("combobox", { name: "Search this folder" }),
      { target: { value: "not" } },
    );
    const suggestion = await screen.findByRole("option", { name: /Notes/ });
    expect(suggestion).toHaveAttribute("href", "/folders/4");
    fireEvent.click(suggestion);
    expect(router.state.location.pathname).toBe("/folders/4");
    expect(router.state.location.pathname).not.toBe("/folders/5");
  });

  test("enter runs the chosen match with the folder in the url", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/folders/1");
    const box = await screen.findByRole("combobox", {
      name: "Search this folder",
    });

    fireEvent.click(screen.getByRole("button", { name: "Exact name" }));
    fireEvent.change(box, { target: { value: "designs" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(router.state.location.pathname).toBe("/search");
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("q")).toBe("designs");
    expect(params.get("match")).toBe("EXACT");
    expect(params.get("parentId")).toBe("1");
    expect(
      await screen.findByRole("link", { name: /Designs/ }),
    ).toBeInTheDocument();
  });

  test("opens a shared search and follows a result to its parent", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/search?q=des&match=PREFIX&parentId=1");

    const result = await screen.findByRole("link", { name: /Designs/ });
    expect(result).toHaveAttribute("href", "/folders/1");
    fireEvent.click(result);
    expect(router.state.location.pathname).toBe("/folders/1");
    expect(
      await screen.findByRole("heading", { name: "Home" }),
    ).toBeInTheDocument();
  });

  test("can switch a shared search to an exact name", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/search?q=des&match=PREFIX&parentId=1");

    expect(
      await screen.findByRole("link", { name: /Designs/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Exact name" }));
    expect(await screen.findByText("No matches.")).toBeInTheDocument();
    expect(new URLSearchParams(router.state.location.search).get("match")).toBe(
      "EXACT",
    );
  });

  test("searches the whole tree when the url has no folder", async () => {
    const seen: URL[] = [];
    server.use(...nodeHandlers({ onSearch: (url) => seen.push(url) }));
    renderAt("/search?q=des&match=PREFIX");

    expect(
      await screen.findByRole("link", { name: /Designs/ }),
    ).toBeInTheDocument();
    expect(seen[0]?.searchParams.get("parentId")).toBeNull();
    expect(seen[0]?.searchParams.get("limit")).toBeNull();
  });

  test("does not call the api for a malformed folder id", () => {
    let hits = 0;
    server.use(
      ...nodeHandlers({
        onSearch: () => {
          hits += 1;
        },
      }),
    );
    renderAt("/search?q=des&match=PREFIX&parentId=abc");

    expect(
      screen.getByRole("heading", { name: "Folder not found" }),
    ).toBeInTheDocument();
    expect(hits).toBe(0);
  });

  test("does not call the api for a match the api does not have", () => {
    let hits = 0;
    server.use(
      ...nodeHandlers({
        onSearch: () => {
          hits += 1;
        },
      }),
    );
    renderAt("/search?q=des&match=LIKE");

    expect(
      screen.getByText("This search link is not valid."),
    ).toBeInTheDocument();
    expect(hits).toBe(0);
  });

  test("does not offer search on a file", async () => {
    server.use(...nodeHandlers());
    renderAt("/folders/5");

    expect(await screen.findByText("This is a file.")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Search this folder" }),
    ).not.toBeInTheDocument();
  });
});
