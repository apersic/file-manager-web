import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  parseNodeDetail,
  type NodeDetail,
  type NodeId,
} from "@/features/file-manager/node";

export function getNode(input: {
  id: NodeId;
  signal?: AbortSignal;
}): Promise<NodeDetail> {
  const url = `/api/v1/nodes/${input.id}`;
  if (input.signal === undefined) {
    return apiClient.get<unknown>(url).then(parseNodeDetail);
  }
  return apiClient
    .get<unknown>(url, { signal: input.signal })
    .then(parseNodeDetail);
}

export function nodeQueryOptions(id: NodeId) {
  return queryOptions({
    queryKey: ["nodes", id],
    queryFn: ({ signal }) => getNode({ id, signal }),
  });
}
