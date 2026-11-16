import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { type ReactNode } from "react";

type PageProps = {
  title: string;
  leading?: ReactNode;
  children: ReactNode;
};

export function Page({ title, leading, children }: PageProps) {
  return (
    <Box
      component="main"
      id="content"
      tabIndex={-1}
      sx={{
        px: { xs: 2, md: 5 },
        pt: { xs: 2, md: 4 },
        pb: 6,
        maxWidth: 960,
        outline: "none",
      }}
    >
      {leading}
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 2, textWrap: "balance", scrollMarginTop: 24 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}
