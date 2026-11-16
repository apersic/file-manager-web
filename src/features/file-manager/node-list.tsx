import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import { type NodeSummary } from "@/features/file-manager/node";
import { NodeRow } from "@/features/file-manager/node-row";

export function FileColumns() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: { xs: "none", sm: "flex" },
        alignItems: "center",
        px: 2,
        pr: "8.5rem",
        pb: 0.5,
        color: "text.secondary",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <Box component="span" sx={{ flex: 1 }}>
        Name
      </Box>
      <Box component="span" sx={{ width: "7.5rem", textAlign: "right" }}>
        Modified
      </Box>
    </Box>
  );
}

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
      <FileColumns />
      <List aria-label="Folder contents" disablePadding>
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
