import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { router as appRouter } from "@/app/router";
import { theme } from "@/app/theme";
import { queryClient } from "@/lib/query-client";

type AppProviderProps = {
  router?: typeof appRouter;
};

export function AppProvider({ router = appRouter }: AppProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ToastContainer position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
