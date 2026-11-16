import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { Page } from "@/components/page";

export function NotFoundPage() {
  return (
    <Page title="Page not found">
      <Typography gutterBottom>This page does not exist.</Typography>
      <Link component={RouterLink} to="/">
        Back home
      </Link>
    </Page>
  );
}
