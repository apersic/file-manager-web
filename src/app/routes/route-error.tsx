import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { Page } from "@/components/page";

export function RouteError() {
  return (
    <Page title="This page failed to render">
      <Typography gutterBottom>Reload the page and try again.</Typography>
      <Link component={RouterLink} to="/">
        Back home
      </Link>
    </Page>
  );
}
