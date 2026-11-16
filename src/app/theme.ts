import { createTheme } from "@mui/material/styles";

const canvas = "#f7f5f2";
const surface = "#ffffff";
const graphite = "#1e1919";
const inkMuted = "#6f675e";
const line = "#e6e1d8";
const blue = "#0061fe";
const blueHover = "#0050d4";
const focus = "#a0d1fa";

export const chrome = {
  navSelected: "rgba(0, 97, 254, 0.1)",
  navSelectedHover: "rgba(0, 97, 254, 0.16)",
};

const focusRing = {
  "&:focus-visible": {
    outline: `2px solid ${focus}`,
    outlineOffset: 2,
  },
};

export const theme = createTheme({
  palette: {
    primary: {
      main: blue,
      dark: blueHover,
      contrastText: surface,
    },
    text: {
      primary: graphite,
      secondary: inkMuted,
    },
    divider: line,
    background: {
      default: canvas,
      paper: surface,
    },
    action: {
      hover: "hsla(36, 23%, 55%, 0.14)",
      selected: "hsla(36, 23%, 55%, 0.24)",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontSize: "1.75rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          backgroundColor: canvas,
          colorScheme: "light",
        },
        body: {
          backgroundColor: canvas,
          color: graphite,
          touchAction: "manipulation",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          ...focusRing,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: focusRing,
      },
    },
    MuiLink: {
      styleOverrides: {
        root: focusRing,
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: focusRing,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: surface,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          overscrollBehavior: "contain",
        },
      },
    },
  },
});
