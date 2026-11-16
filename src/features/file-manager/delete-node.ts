import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { childrenQueryKey } from "@/features/file-manager/get-children";
import { type NodeId } from "@/features/file-manager/node";

export async function deleteNode(id: NodeId): Promise<void> {
  try {
    await apiClient.delete<unknown>(`/api/v1/nodes/${id}`, { gone: true });
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return;
    }
    throw error;
  }
}

export function useDeleteNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: NodeId; parentId: NodeId | null }) =>
      deleteNode(input.id),
    onSuccess: (_result, input) => {
      const refreshes = [
        queryClient.invalidateQueries({ queryKey: ["nodes", "search"] }),
        queryClient.invalidateQueries({ queryKey: ["nodes", input.id] }),
      ];
      if (input.parentId !== null) {
        refreshes.push(
          queryClient.invalidateQueries({
            queryKey: childrenQueryKey(input.parentId),
          }),
        );
      }
      return Promise.all(refreshes);
    },
  });
}
