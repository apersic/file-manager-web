import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Link as RouterLink } from "react-router";
import { DeleteNodeButton } from "@/features/file-manager/delete-node-button";
import { type NodeKind, type NodeSummary } from "@/features/file-manager/node";

type NodeRowProps = {
  node: NodeSummary;
};

function rowLabel(kind: NodeKind): string {
  switch (kind) {
    case "FOLDER":
      return "Folder";
    case "FILE":
      return "File";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function RowBody({ node }: { node: NodeSummary }) {
  switch (node.kind) {
    case "FOLDER":
      return (
        <ListItemButton component={RouterLink} to={`/folders/${node.id}`}>
          <ListItemText primary={node.name} secondary={rowLabel(node.kind)} />
        </ListItemButton>
      );
    case "FILE":
      return (
        <ListItemText primary={node.name} secondary={rowLabel(node.kind)} />
      );
    default: {
      const unreachable: never = node.kind;
      return unreachable;
    }
  }
}

export function NodeRow({ node }: NodeRowProps) {
  return (
    <ListItem secondaryAction={<DeleteNodeButton node={node} />}>
      <RowBody node={node} />
    </ListItem>
  );
}
