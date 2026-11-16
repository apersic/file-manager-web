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
};

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

function errorBody(status: number, path: string, message: string) {
  return {
    message,
    status,
    error: status === 404 ? "Not Found" : "Conflict",
    timestamp: createdAt,
    path,
  };
}

export function nodeHandlers(options: NodeHandlersOptions = {}) {
  const nodes = options.nodes ?? catalog;
  const pageSize = options.pageSize ?? 50;

  return [
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
