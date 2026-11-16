import { infiniteQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  parseNodePage,
  type NodeId,
  type NodePage,
} from "@/features/file-manager/node";

const firstCursor: string | null = null;

export function getChildren(input: {
  parentId: NodeId;
  cursor: string | null;
  signal?: AbortSignal;
}): Promise<NodePage> {
  const params: { parentId: NodeId; cursor?: string } = {
    parentId: input.parentId,
  };
  if (input.cursor !== null) {
    params.cursor = input.cursor;
  }
  if (input.signal === undefined) {
    return apiClient
      .get<unknown>("/api/v1/nodes", { params })
      .then(parseNodePage);
  }
  return apiClient
    .get<unknown>("/api/v1/nodes", { params, signal: input.signal })
    .then(parseNodePage);
}

export function childrenQueryKey(parentId: NodeId) {
  return ["nodes", parentId, "children"] as const;
}

export function childrenQueryOptions(parentId: NodeId) {
  return infiniteQueryOptions({
    queryKey: childrenQueryKey(parentId),
    queryFn: ({ pageParam, signal }) =>
      getChildren({ parentId, cursor: pageParam, signal }),
    initialPageParam: firstCursor,
    getNextPageParam: (page) => page.nextCursor,
  });
}
