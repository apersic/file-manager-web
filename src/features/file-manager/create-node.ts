import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { childrenQueryKey } from "@/features/file-manager/get-children";
import {
  parseNodeSummary,
  type NodeId,
  type NodeKind,
  type NodeSummary,
} from "@/features/file-manager/node";

export function createNode(input: {
  parentId: NodeId;
  kind: NodeKind;
  name: string;
}): Promise<NodeSummary> {
  return apiClient
    .post<unknown>(
      "/api/v1/nodes",
      {
        parentId: input.parentId,
        kind: input.kind,
        name: input.name,
      },
      { formFields: true },
    )
    .then(parseNodeSummary);
}

function isConflict(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}

export function useCreateNode(parentId: NodeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: NodeKind; name: string }) =>
      createNode({ parentId, kind: input.kind, name: input.name }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: childrenQueryKey(parentId),
      }),
    onError: (error: unknown) => {
      if (!isConflict(error)) {
        return;
      }
      return queryClient.refetchQueries({
        queryKey: childrenQueryKey(parentId),
      });
    },
  });
}
