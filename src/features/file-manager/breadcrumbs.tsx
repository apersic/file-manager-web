import Link from "@mui/material/Link";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { type Ancestor, type NodeSummary } from "@/features/file-manager/node";

type FolderBreadcrumbsProps = {
  ancestors: Ancestor[];
  current: Pick<NodeSummary, "name">;
};

export function FolderBreadcrumbs({
  ancestors,
  current,
}: FolderBreadcrumbsProps) {
  return (
    <Breadcrumbs aria-label="Folder path" sx={{ mb: 1 }}>
      {ancestors.map((ancestor) => (
        <Link
          key={ancestor.id}
          component={RouterLink}
          to={`/folders/${ancestor.id}`}
          underline="hover"
          sx={{ color: "text.secondary", fontSize: 13 }}
        >
          {ancestor.name}
        </Link>
      ))}
      <Typography
        aria-current="page"
        sx={{ color: "text.primary", fontSize: 13, fontWeight: 600 }}
      >
        {current.name}
      </Typography>
    </Breadcrumbs>
  );
}
