import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Page } from "@/components/page";

export function HomePage() {
  return (
    <Page title="File manager">
      <Typography>
        Browsing is not implemented yet. The rules are in the{" "}
        <Link href="/specification.md">specification</Link>.
      </Typography>
    </Page>
  );
}
