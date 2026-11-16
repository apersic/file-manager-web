import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { type ReactNode } from "react";

type PageProps = {
  title: string;
  children: ReactNode;
};

export function Page({ title, children }: PageProps) {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {children}
    </Container>
  );
}
