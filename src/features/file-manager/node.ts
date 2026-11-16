export type NodeId = number & { readonly __brand: "NodeId" };

export type NodeKind = "FILE" | "FOLDER";

export type Ancestor = {
  id: NodeId;
  name: string;
  kind: NodeKind;
};

export type NodeSummary = {
  id: NodeId;
  parentId: NodeId | null;
  kind: NodeKind;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type NodeDetail = NodeSummary & {
  ancestors: Ancestor[];
};

export type NodePage = {
  items: NodeSummary[];
  nextCursor: string | null;
};

export function parseNodeId(value: unknown): NodeId | null {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0 ||
    !Number.isSafeInteger(value)
  ) {
    return null;
  }
  return value as NodeId;
}

export function parseFolderId(value: string | undefined): NodeId | null {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  return parseNodeId(Number(value));
}

function invalidResponse(): never {
  throw new Error("The nodes response was not valid");
}

function parseKind(value: unknown): NodeKind | null {
  if (value === "FILE" || value === "FOLDER") {
    return value;
  }
  return null;
}

function parseName(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  return value;
}

function parseTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  return value;
}

function parseParentId(value: unknown): NodeId | null | undefined {
  if (value === null) {
    return null;
  }
  const id = parseNodeId(value);
  if (id === null) {
    return undefined;
  }
  return id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSummary(value: unknown): NodeSummary | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseNodeId(value.id);
  const parentId = parseParentId(value.parentId);
  const kind = parseKind(value.kind);
  const name = parseName(value.name);
  const createdAt = parseTimestamp(value.createdAt);
  const updatedAt = parseTimestamp(value.updatedAt);
  if (
    id === null ||
    parentId === undefined ||
    kind === null ||
    name === null ||
    createdAt === null ||
    updatedAt === null
  ) {
    return null;
  }
  return { id, parentId, kind, name, createdAt, updatedAt };
}

function parseAncestor(value: unknown): Ancestor | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseNodeId(value.id);
  const name = parseName(value.name);
  const kind = parseKind(value.kind);
  if (id === null || name === null || kind === null) {
    return null;
  }
  return { id, name, kind };
}

export function parseNodeDetail(value: unknown): NodeDetail {
  const summary = parseSummary(value);
  if (summary === null || !isRecord(value) || !Array.isArray(value.ancestors)) {
    return invalidResponse();
  }
  const ancestors: Ancestor[] = [];
  for (const ancestor of value.ancestors) {
    const parsed = parseAncestor(ancestor);
    if (parsed === null) {
      return invalidResponse();
    }
    ancestors.push(parsed);
  }
  return { ...summary, ancestors };
}

export function parseNodePage(value: unknown): NodePage {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return invalidResponse();
  }
  if (value.nextCursor !== null && typeof value.nextCursor !== "string") {
    return invalidResponse();
  }
  const items: NodeSummary[] = [];
  for (const item of value.items) {
    const parsed = parseSummary(item);
    if (parsed === null) {
      return invalidResponse();
    }
    items.push(parsed);
  }
  return { items, nextCursor: value.nextCursor };
}
