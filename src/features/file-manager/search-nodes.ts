import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  parseFolderId,
  parseNodePage,
  type NodeId,
  type NodePage,
  type NodeSummary,
} from "@/features/file-manager/node";

export type SearchMatch = "EXACT" | "PREFIX";

export const suggestionLimit = 10;

const firstCursor: string | null = null;

export type SearchRequest =
  | { status: "blank" }
  | { status: "bad-match" }
  | { status: "bad-folder" }
  | {
      status: "ready";
      q: string;
      match: SearchMatch;
      parentId: NodeId | null;
    };

export function parseSearchMatch(value: string | null): SearchMatch | null {
  if (value === "EXACT" || value === "PREFIX") {
    return value;
  }
  return null;
}

export function readSearchRequest(params: URLSearchParams): SearchRequest {
  const q = params.get("q");
  if (q === null || q.trim() === "") {
    return { status: "blank" };
  }
  const match = parseSearchMatch(params.get("match"));
  if (match === null) {
    return { status: "bad-match" };
  }
  const parent = params.get("parentId");
  if (parent === null) {
    return { status: "ready", q, match, parentId: null };
  }
  const parentId = parseFolderId(parent);
  if (parentId === null) {
    return { status: "bad-folder" };
  }
  return { status: "ready", q, match, parentId };
}

export function searchPath(input: {
  q: string;
  match: SearchMatch;
  parentId: NodeId | null;
}): string {
  const params = new URLSearchParams();
  params.set("q", input.q);
  params.set("match", input.match);
  if (input.parentId !== null) {
    params.set("parentId", String(input.parentId));
  }
  return `/search?${params.toString()}`;
}

export function parentFolderPath(
  node: Pick<NodeSummary, "id" | "parentId">,
): string {
  if (node.parentId === null) {
    return `/folders/${node.id}`;
  }
  return `/folders/${node.parentId}`;
}

export function searchNodes(input: {
  q: string;
  match: SearchMatch;
  parentId: NodeId | null;
  cursor: string | null;
  limit?: number;
  signal?: AbortSignal;
}): Promise<NodePage> {
  const params: {
    q: string;
    match: SearchMatch;
    parentId?: NodeId;
    cursor?: string;
    limit?: number;
  } = {
    q: input.q,
    match: input.match,
  };
  if (input.parentId !== null) {
    params.parentId = input.parentId;
  }
  if (input.cursor !== null) {
    params.cursor = input.cursor;
  }
  if (input.limit !== undefined) {
    params.limit = input.limit;
  }
  if (input.signal === undefined) {
    return apiClient
      .get<unknown>("/api/v1/nodes/search", { params })
      .then(parseNodePage);
  }
  return apiClient
    .get<unknown>("/api/v1/nodes/search", { params, signal: input.signal })
    .then(parseNodePage);
}

export function suggestionQueryOptions(input: { q: string; parentId: NodeId }) {
  return queryOptions({
    queryKey: ["nodes", "search", "suggest", input.parentId, input.q],
    queryFn: ({ signal }) =>
      searchNodes({
        q: input.q,
        match: "PREFIX",
        parentId: input.parentId,
        cursor: null,
        limit: suggestionLimit,
        signal,
      }),
  });
}

export function searchQueryOptions(input: {
  q: string;
  match: SearchMatch;
  parentId: NodeId | null;
}) {
  return infiniteQueryOptions({
    queryKey: ["nodes", "search", input.match, input.parentId, input.q],
    queryFn: ({ pageParam, signal }) =>
      searchNodes({
        q: input.q,
        match: input.match,
        parentId: input.parentId,
        cursor: pageParam,
        signal,
      }),
    initialPageParam: firstCursor,
    getNextPageParam: (page) => page.nextCursor,
  });
}
