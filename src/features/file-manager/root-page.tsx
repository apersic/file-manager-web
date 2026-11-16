import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { Page } from "@/components/page";
import { rootQueryOptions } from "@/features/file-manager/get-root";

export function RootPage() {
  const root = useQuery(rootQueryOptions());

  if (root.isLoading) {
    return (
      <Page title="File manager">
        <Typography role="status">Loading folder</Typography>
      </Page>
    );
  }

  if (root.isError || root.data === undefined) {
    return (
      <Page title="File manager">
        <Typography>Home could not be loaded.</Typography>
      </Page>
    );
  }

  return <Navigate to={`/folders/${root.data.id}`} replace />;
}
