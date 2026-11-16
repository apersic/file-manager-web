import { fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { nodeHandlers } from "@/test/nodes";
import { renderAt } from "@/test/render-app";
import { server } from "@/test/server";

const createdAt = "2026-11-16T12:00:00Z";

describe("create files and folders", () => {
  test("creates a folder, opens it, and creates a file", async () => {
    let created: unknown;
    let idempotency: string | null = "unset";
    server.use(
      ...nodeHandlers({
        onCreate: ({ body, headers }) => {
          created = body;
          idempotency = headers.get("idempotency-key");
        },
      }),
    );
    const { router } = renderAt("/folders/1");

    fireEvent.click(await screen.findByRole("button", { name: "New folder" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Plans" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    const folder = await screen.findByRole("link", { name: /Plans/ });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(created).toEqual({ parentId: 1, kind: "FOLDER", name: "Plans" });
    expect(idempotency).toBeNull();

    fireEvent.click(folder);
    expect(
      await screen.findByRole("heading", { name: "Plans" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).not.toBe("/folders/1");

    fireEvent.click(screen.getByRole("button", { name: "New file" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Notes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Notes")).toBeInTheDocument();
    expect(created).toEqual({ parentId: 7, kind: "FILE", name: "Notes" });
    expect(idempotency).toBeNull();
  });

  test("shows a 400 name error on the form", async () => {
    server.use(...nodeHandlers());
    renderAt("/folders/1");

    fireEvent.click(await screen.findByRole("button", { name: "New folder" }));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByRole("alert", { hidden: true }),
    ).not.toBeInTheDocument();
  });

  test("shows a 400 field that is not the name", async () => {
    server.use(
      http.post("*/api/v1/nodes", () =>
        HttpResponse.json({ parentId: "Parent is required" }, { status: 400 }),
      ),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");

    fireEvent.click(await screen.findByRole("button", { name: "New file" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("parentId: Parent is required"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("alert", { hidden: true }),
    ).not.toBeInTheDocument();
  });

  test("refetches the parent list when the name already exists", async () => {
    let lists = 0;
    server.use(
      http.post("*/api/v1/nodes", () =>
        HttpResponse.json(
          {
            message: "A file or folder with this name already exists",
            status: 409,
            error: "Conflict",
            timestamp: createdAt,
            path: "/api/v1/nodes",
          },
          { status: 409 },
        ),
      ),
      http.get("*/api/v1/nodes", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("parentId") !== "1") {
          return HttpResponse.json({ items: [], nextCursor: null });
        }
        lists += 1;
        const items =
          lists === 1
            ? []
            : [
                {
                  id: 9,
                  parentId: 1,
                  kind: "FOLDER",
                  name: "Plans",
                  createdAt,
                  updatedAt: createdAt,
                },
              ];
        return HttpResponse.json({ items, nextCursor: null });
      }),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");

    expect(
      await screen.findByText("This folder is empty."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Plans" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByRole("alert", { hidden: true }),
    ).toHaveTextContent("A file or folder with this name already exists");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("link", { name: /Plans/ }),
    ).toBeInTheDocument();
    expect(lists).toBe(2);
  });

  test("toasts a failure that is not a field map", async () => {
    server.use(
      http.post("*/api/v1/nodes", () =>
        HttpResponse.json(
          {
            message: "An unexpected error occurred",
            status: 500,
            error: "Internal Server Error",
            timestamp: createdAt,
            path: "/api/v1/nodes",
          },
          { status: 500 },
        ),
      ),
      ...nodeHandlers(),
    );
    renderAt("/folders/1");

    fireEvent.click(await screen.findByRole("button", { name: "New folder" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Plans" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByRole("alert", { hidden: true }),
    ).toHaveTextContent("An unexpected error occurred");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Plans/, hidden: true }),
    ).not.toBeInTheDocument();
  });

  test("does not offer create on a file", async () => {
    server.use(...nodeHandlers());
    renderAt("/folders/5");

    expect(await screen.findByText("This is a file.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New folder" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New file" }),
    ).not.toBeInTheDocument();
  });
});
