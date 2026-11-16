import { http, HttpResponse } from "msw";

export type CatalogNode = {
  id: number;
  parentId: number | null;
  kind: "FILE" | "FOLDER";
  name: string;
};

const createdAt = "2026-11-16T12:00:00Z";

export const home: CatalogNode = {
  id: 1,
  parentId: null,
  kind: "FOLDER",
  name: "Home",
};

export const designs: CatalogNode = {
  id: 4,
  parentId: 1,
  kind: "FOLDER",
  name: "Designs",
};

export const notes: CatalogNode = {
  id: 5,
  parentId: 4,
  kind: "FILE",
  name: "Notes",
};

export const photos: CatalogNode = {
  id: 6,
  parentId: 1,
  kind: "FOLDER",
  name: "Photos",
};

export const catalog: CatalogNode[] = [home, designs, notes, photos];

type NodeHandlersOptions = {
  nodes?: CatalogNode[];
  pageSize?: number;
  onList?: (url: URL) => void;
  onCreate?: (input: { body: unknown; headers: Headers }) => void;
  onSearch?: (url: URL) => void;
};

function compareByKey(left: CatalogNode, right: CatalogNode): number {
  const byName = nameKey(left.name).localeCompare(nameKey(right.name));
  if (byName !== 0) {
    return byName;
  }
  return left.id - right.id;
}

function compare(left: CatalogNode, right: CatalogNode): number {
  const byName = left.name.localeCompare(right.name);
  if (byName !== 0) {
    return byName;
  }
  return left.id - right.id;
}

function ancestorsOf(node: CatalogNode, nodes: CatalogNode[]) {
  const chain: { id: number; name: string; kind: CatalogNode["kind"] }[] = [];
  const seen = new Set<number>();
  let parentId = node.parentId;
  while (parentId !== null) {
    if (seen.has(parentId)) {
      break;
    }
    seen.add(parentId);
    const parent = nodes.find((item) => item.id === parentId);
    if (parent === undefined) {
      break;
    }
    chain.push({ id: parent.id, name: parent.name, kind: parent.kind });
    parentId = parent.parentId;
  }
  return chain.reverse();
}

function toResponse(node: CatalogNode) {
  return {
    id: node.id,
    parentId: node.parentId,
    kind: node.kind,
    name: node.name,
    createdAt,
    updatedAt: createdAt,
  };
}

export function toDetail(node: CatalogNode, nodes: CatalogNode[] = catalog) {
  return {
    ...toResponse(node),
    ancestors: ancestorsOf(node, nodes),
  };
}

function statusError(status: number): string {
  switch (status) {
    case 400:
      return "Bad Request";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    default:
      return "Error";
  }
}

function errorBody(status: number, path: string, message: string) {
  return {
    message,
    status,
    error: statusError(status),
    timestamp: createdAt,
    path,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nameKey(name: string): string {
  return name.replace(/[A-Z]/g, (letter) =>
    String.fromCharCode(letter.charCodeAt(0) + 32),
  );
}

function readCreate(body: unknown):
  | {
      ok: true;
      parentId: number;
      kind: CatalogNode["kind"];
      name: string;
    }
  | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const record = isRecord(body) ? body : {};
  const parentId = record.parentId;
  const kind = record.kind;
  const name = record.name;
  const parsedParent =
    typeof parentId === "number" && Number.isInteger(parentId) && parentId > 0
      ? parentId
      : null;
  const parsedKind = kind === "FILE" || kind === "FOLDER" ? kind : null;
  const parsedName =
    typeof name === "string" && name.trim() !== "" ? name : null;
  if (parsedParent === null) {
    fields.parentId = "Parent is required";
  }
  if (parsedKind === null) {
    fields.kind = "Kind is required";
  }
  if (parsedName === null) {
    fields.name = "Name is required";
  }
  if (parsedParent === null || parsedKind === null || parsedName === null) {
    return { ok: false, fields };
  }
  return {
    ok: true,
    parentId: parsedParent,
    kind: parsedKind,
    name: parsedName,
  };
}

export function nodeHandlers(options: NodeHandlersOptions = {}) {
  const nodes = [...(options.nodes ?? catalog)];
  const pageSize = options.pageSize ?? 50;
  let nextId = nodes.reduce((max, node) => Math.max(max, node.id), 0) + 1;

  return [
    http.get("*/api/v1/nodes/search", ({ request }) => {
      const url = new URL(request.url);
      options.onSearch?.(url);
      const q = url.searchParams.get("q");
      const match = url.searchParams.get("match");
      if (q === null || q.trim() === "") {
        return HttpResponse.json({ q: "Query is required" }, { status: 400 });
      }
      if (match !== "EXACT" && match !== "PREFIX") {
        return HttpResponse.json(
          { match: "Match is required" },
          { status: 400 },
        );
      }
      const parentParam = url.searchParams.get("parentId");
      let scope: number | null = null;
      if (parentParam !== null) {
        scope = Number(parentParam);
        const parent = nodes.find((node) => node.id === scope);
        if (parent === undefined) {
          return HttpResponse.json(
            errorBody(404, url.pathname, "Folder was not found"),
            { status: 404 },
          );
        }
        if (parent.kind !== "FOLDER") {
          return HttpResponse.json(
            errorBody(409, url.pathname, "Parent is not a folder"),
            { status: 409 },
          );
        }
      }
      const queryKey = nameKey(q);
      const matched = nodes
        .filter((node) => {
          if (scope !== null && node.parentId !== scope) {
            return false;
          }
          const key = nameKey(node.name);
          if (match === "EXACT") {
            return key === queryKey;
          }
          return key.startsWith(queryKey);
        })
        .sort(compareByKey);
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam === null ? 50 : Number(limitParam);
      const cursor = url.searchParams.get("cursor");
      const start = cursor === null ? 0 : Number(cursor);
      const items = matched.slice(start, start + limit).map(toResponse);
      const next =
        start + limit < matched.length ? String(start + limit) : null;
      return HttpResponse.json({ items, nextCursor: next });
    }),
    http.get("*/api/v1/nodes/root", () => {
      const root = nodes.find((node) => node.parentId === null);
      if (root === undefined) {
        return HttpResponse.json(
          errorBody(404, "/api/v1/nodes/root", "Not Found"),
          { status: 404 },
        );
      }
      return HttpResponse.json(toDetail(root, nodes));
    }),
    http.get("*/api/v1/nodes", ({ request }) => {
      const url = new URL(request.url);
      options.onList?.(url);
      const parentId = Number(url.searchParams.get("parentId"));
      const parent = nodes.find((node) => node.id === parentId);
      if (parent === undefined) {
        return HttpResponse.json(errorBody(404, url.pathname, "Not Found"), {
          status: 404,
        });
      }
      if (parent.kind !== "FOLDER") {
        return HttpResponse.json(
          errorBody(409, url.pathname, "Parent is not a folder"),
          { status: 409 },
        );
      }
      const cursor = url.searchParams.get("cursor");
      const start = cursor === null ? 0 : Number(cursor);
      const children = nodes
        .filter((node) => node.parentId === parentId)
        .sort(compare);
      const items = children.slice(start, start + pageSize).map(toResponse);
      const next =
        start + pageSize < children.length ? String(start + pageSize) : null;
      return HttpResponse.json({ items, nextCursor: next });
    }),
    http.post("*/api/v1/nodes", async ({ request }) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return HttpResponse.json(
          errorBody(400, "/api/v1/nodes", "Malformed request body"),
          { status: 400 },
        );
      }
      options.onCreate?.({ body, headers: request.headers });
      const parsed = readCreate(body);
      if (!parsed.ok) {
        return HttpResponse.json(parsed.fields, { status: 400 });
      }
      const parent = nodes.find((node) => node.id === parsed.parentId);
      if (parent === undefined) {
        return HttpResponse.json(errorBody(404, "/api/v1/nodes", "Not Found"), {
          status: 404,
        });
      }
      if (parent.kind !== "FOLDER") {
        return HttpResponse.json(
          errorBody(409, "/api/v1/nodes", "Parent is not a folder"),
          { status: 409 },
        );
      }
      const duplicate = nodes.some(
        (node) =>
          node.parentId === parsed.parentId &&
          nameKey(node.name) === nameKey(parsed.name),
      );
      if (duplicate) {
        return HttpResponse.json(
          errorBody(
            409,
            "/api/v1/nodes",
            "A file or folder with this name already exists",
          ),
          { status: 409 },
        );
      }
      const created: CatalogNode = {
        id: nextId,
        parentId: parsed.parentId,
        kind: parsed.kind,
        name: parsed.name,
      };
      nextId += 1;
      nodes.push(created);
      return HttpResponse.json(toResponse(created), { status: 201 });
    }),
    http.get("*/api/v1/nodes/:id", ({ params }) => {
      const id = Number(params.id);
      const node = nodes.find((item) => item.id === id);
      const path = `/api/v1/nodes/${String(params.id)}`;
      if (node === undefined) {
        return HttpResponse.json(errorBody(404, path, "Not Found"), {
          status: 404,
        });
      }
      return HttpResponse.json(toDetail(node, nodes));
    }),
  ];
}
