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
    <Breadcrumbs aria-label="Folder path">
      {ancestors.map((ancestor) => (
        <Link
          key={ancestor.id}
          component={RouterLink}
          to={`/folders/${ancestor.id}`}
        >
          {ancestor.name}
        </Link>
      ))}
      <Typography aria-current="page">{current.name}</Typography>
    </Breadcrumbs>
  );
}
