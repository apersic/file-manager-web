import { fireEvent, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { designs, type CatalogNode, nodeHandlers } from "@/test/nodes";
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

describe("delete", () => {
  test("deletes a folder and the nodes inside it after the server confirms", async () => {
    server.use(...nodeHandlers());
    const { router } = renderAt("/folders/1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Designs" }),
    );
    expect(
      screen.getByText("Delete Designs? This deletes everything inside it."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /Designs/, hidden: true }),
      ).not.toBeInTheDocument();
    });
    await router.navigate("/folders/4");
    expect(
      await screen.findByRole("heading", { name: "Folder not found" }),
    ).toBeInTheDocument();
    await router.navigate("/folders/5");
    expect(
      screen.getByRole("heading", { name: "Folder not found" }),
    ).toBeInTheDocument();
  });

  test("keeps the row until the server responds", async () => {
    let released = false;
    server.use(
      http.delete("*/api/v1/nodes/:id", async () => {
        await delay(200);
        released = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.get("*/api/v1/nodes", ({ request }) => {
        const parentId = new URL(request.url).searchParams.get("parentId");
        if (parentId !== "1") {
          return HttpResponse.json({ items: [], nextCursor: null });
        }
        return HttpResponse.json({
          items: released ? [] : [summary(designs)],
          nextCursor: null,
        });
      }),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Designs" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen.getByRole("link", { name: /Designs/, hidden: true }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /Designs/ }),
      ).not.toBeInTheDocument();
    });
  });

  test("treats a 404 as already gone", async () => {
    let gone = false;
    server.use(
      http.delete("*/api/v1/nodes/:id", () => {
        gone = true;
        return HttpResponse.json(
          {
            message: "Node was not found",
            status: 404,
            error: "Not Found",
            timestamp: createdAt,
            path: "/api/v1/nodes/4",
          },
          { status: 404 },
        );
      }),
      http.get("*/api/v1/nodes", ({ request }) => {
        const parentId = new URL(request.url).searchParams.get("parentId");
        if (parentId !== "1") {
          return HttpResponse.json({ items: [], nextCursor: null });
        }
        return HttpResponse.json({
          items: gone ? [] : [summary(designs)],
          nextCursor: null,
        });
      }),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Designs" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /Designs/ }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("alert", { hidden: true }),
    ).not.toBeInTheDocument();
  });

  test("leaves the row when the server refuses", async () => {
    server.use(
      http.delete("*/api/v1/nodes/:id", () =>
        HttpResponse.json(
          {
            message: "The root folder cannot be deleted",
            status: 409,
            error: "Conflict",
            timestamp: createdAt,
            path: "/api/v1/nodes/4",
          },
          { status: 409 },
        ),
      ),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Designs" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The root folder cannot be deleted",
    );
    expect(screen.getByRole("link", { name: /Designs/ })).toBeInTheDocument();
  });

  test("does not delete when the confirm is cancelled", async () => {
    let hits = 0;
    server.use(
      ...nodeHandlers({
        onDelete: () => {
          hits += 1;
        },
      }),
    );
    renderAt("/folders/1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Designs" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Designs/ })).toBeInTheDocument();
    expect(hits).toBe(0);
  });

  test("confirms a file delete without the folder warning", async () => {
    server.use(...nodeHandlers());
    renderAt("/folders/4");

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Notes" }),
    );
    expect(screen.getByText("Delete Notes?")).toBeInTheDocument();
    expect(screen.queryByText(/everything inside/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Designs" }),
    ).toBeInTheDocument();
  });

  test("drops a deleted name from an open search", async () => {
    server.use(...nodeHandlers());
    renderAt("/folders/1");

    fireEvent.change(
      await screen.findByRole("combobox", { name: "Search this folder" }),
      { target: { value: "des" } },
    );
    expect(
      await screen.findByRole("option", { name: /Designs/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Designs" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("No matches.")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Designs/ }),
    ).not.toBeInTheDocument();
  });
});
