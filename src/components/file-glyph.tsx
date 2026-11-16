import Box from "@mui/material/Box";

type GlyphKind = "FILE" | "FOLDER";

type FileGlyphProps = {
  kind: GlyphKind;
};

export function FileGlyph({ kind }: FileGlyphProps) {
  switch (kind) {
    case "FOLDER":
      return (
        <Box
          component="svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
          sx={{ width: 28, height: 28, flexShrink: 0, color: "primary.main" }}
        >
          <path
            fill="currentColor"
            d="M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h3.7l1.5 1.7h8.4a1.7 1.7 0 0 1 1.7 1.7v8.4a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2z"
          />
        </Box>
      );
    case "FILE":
      return (
        <Box
          component="svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
          sx={{ width: 28, height: 28, flexShrink: 0, color: "text.secondary" }}
        >
          <path
            fill="currentColor"
            d="M7 3.5h6.2L19 9.2V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5H7zm6 1.8V9h3.8L13 5.3z"
          />
        </Box>
      );
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}
