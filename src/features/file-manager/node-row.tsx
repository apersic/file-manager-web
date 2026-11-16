import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { FileGlyph } from "@/components/file-glyph";
import { DeleteNodeButton } from "@/features/file-manager/delete-node-button";
import { type NodeKind, type NodeSummary } from "@/features/file-manager/node";

type NodeRowProps = {
  node: NodeSummary;
  to?: string;
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

function formatModified(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date,
  );
}

function rowTarget(node: NodeSummary, to: string | undefined): string | null {
  if (to !== undefined) {
    return to;
  }
  switch (node.kind) {
    case "FOLDER":
      return `/folders/${node.id}`;
    case "FILE":
      return null;
    default: {
      const unreachable: never = node.kind;
      return unreachable;
    }
  }
}

function RowLabel({ node }: { node: NodeSummary }) {
  return (
    <>
      <FileGlyph kind={node.kind} />
      <ListItemText
        primary={node.name}
        secondary={rowLabel(node.kind)}
        sx={{ my: 0, minWidth: 0 }}
        slotProps={{
          primary: { noWrap: true, sx: { fontWeight: 600 } },
          secondary: { noWrap: true },
        }}
      />
    </>
  );
}

export function NodeRow({ node, to }: NodeRowProps) {
  const href = rowTarget(node, to);
  return (
    <ListItem
      secondaryAction={<DeleteNodeButton node={node} />}
      sx={{
        alignItems: "center",
        borderRadius: 2,
        pr: "8.5rem",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {href === null ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flex: 1,
            minWidth: 0,
            px: 2,
            py: 1,
          }}
        >
          <RowLabel node={node} />
        </Box>
      ) : (
        <ListItemButton
          component={RouterLink}
          to={href}
          sx={{ borderRadius: 2, gap: 1.5, flex: 1, minWidth: 0 }}
        >
          <RowLabel node={node} />
        </ListItemButton>
      )}
      <Typography
        component="span"
        variant="body2"
        sx={{
          display: { xs: "none", sm: "block" },
          width: "7.5rem",
          flexShrink: 0,
          textAlign: "right",
          color: "text.secondary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatModified(node.updatedAt)}
      </Typography>
    </ListItem>
  );
}
