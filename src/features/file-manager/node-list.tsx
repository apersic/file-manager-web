import Button from "@mui/material/Button";
import List from "@mui/material/List";
import { type NodeSummary } from "@/features/file-manager/node";
import { NodeRow } from "@/features/file-manager/node-row";

type NodeListProps = {
  items: NodeSummary[];
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

export function NodeList({
  items,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
}: NodeListProps) {
  return (
    <>
      <List aria-label="Folder contents">
        {items.map((node) => (
          <NodeRow key={node.id} node={node} />
        ))}
      </List>
      {hasNextPage ? (
        <Button type="button" disabled={isLoadingMore} onClick={onLoadMore}>
          {isLoadingMore ? "Loading" : "Load more"}
        </Button>
      ) : null}
    </>
  );
}
