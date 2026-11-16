import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Link as RouterLink } from "react-router";
import { type NodeSummary } from "@/features/file-manager/node";

type NodeRowProps = {
  node: NodeSummary;
};

export function NodeRow({ node }: NodeRowProps) {
  switch (node.kind) {
    case "FOLDER":
      return (
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to={`/folders/${node.id}`}>
            <ListItemText primary={node.name} secondary="Folder" />
          </ListItemButton>
        </ListItem>
      );
    case "FILE":
      return (
        <ListItem>
          <ListItemText primary={node.name} secondary="File" />
        </ListItem>
      );
    default: {
      const unreachable: never = node.kind;
      return unreachable;
    }
  }
}
