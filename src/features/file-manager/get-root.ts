import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { parseNodeDetail, type NodeDetail } from "@/features/file-manager/node";

export function getRoot(signal?: AbortSignal): Promise<NodeDetail> {
  if (signal === undefined) {
    return apiClient.get<unknown>("/api/v1/nodes/root").then(parseNodeDetail);
  }
  return apiClient
    .get<unknown>("/api/v1/nodes/root", { signal })
    .then(parseNodeDetail);
}

export function rootQueryOptions() {
  return queryOptions({
    queryKey: ["nodes", "root"],
    queryFn: ({ signal }) => getRoot(signal),
  });
}
