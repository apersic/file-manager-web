import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { NavLink, Outlet } from "react-router";
import { chrome } from "@/app/theme";
import { FileGlyph } from "../components/file-glyph";

export function AppShell() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: "background.default",
        pl: "env(safe-area-inset-left)",
      }}
    >
      <Box
        component="a"
        href="#content"
        sx={{
          position: "absolute",
          left: 8,
          top: -48,
          zIndex: (muiTheme) => muiTheme.zIndex.tooltip,
          bgcolor: "background.paper",
          color: "text.primary",
          px: 1.5,
          py: 1,
          borderRadius: 1,
          "&:focus": {
            top: "calc(8px + env(safe-area-inset-top))",
          },
        }}
      >
        Skip to content
      </Box>
      <Box
        component="nav"
        aria-label="Files"
        sx={{
          width: { xs: "auto", md: 232 },
          flexShrink: 0,
          bgcolor: "background.paper",
          borderRight: { md: 1 },
          borderBottom: { xs: 1, md: 0 },
          borderColor: "divider",
          px: 1.5,
          pt: "calc(16px + env(safe-area-inset-top))",
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            mb: { xs: 1, md: 2 },
          }}
        >
          <FileGlyph kind="FOLDER" />
          <Typography component="p" sx={{ fontWeight: 700, m: 0 }}>
            Files
          </Typography>
        </Box>
        <Button
          component={NavLink}
          to="/"
          end
          sx={{
            justifyContent: "flex-start",
            width: { xs: "auto", md: "100%" },
            borderRadius: 2,
            px: 1.5,
            py: 1,
            color: "text.primary",
            bgcolor: chrome.navSelected,
            "&:hover": {
              bgcolor: chrome.navSelectedHover,
            },
          }}
        >
          All files
        </Button>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
