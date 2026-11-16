import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import {
  parentFolderPath,
  searchPath,
  suggestionQueryOptions,
  type SearchMatch,
} from "@/features/file-manager/search-nodes";
import { type NodeId, type NodeKind } from "@/features/file-manager/node";

const suggestionDelayMs = 250;

type SearchBoxProps = {
  parentId: NodeId;
};

function kindLabel(kind: NodeKind): string {
  switch (kind) {
    case "FILE":
      return "File";
    case "FOLDER":
      return "Folder";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

export function SearchBox({ parentId }: SearchBoxProps) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [match, setMatch] = useState<SearchMatch>("PREFIX");
  const queryText = debounced.trim() === "" ? "" : debounced;
  const suggestions = useQuery({
    ...suggestionQueryOptions({ q: queryText, parentId }),
    enabled: queryText !== "" && text === debounced,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(text);
    }, suggestionDelayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [text]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim() === "") {
      return;
    }
    void navigate(searchPath({ q: text, match, parentId }));
  }

  function selectMatch(next: SearchMatch) {
    setMatch(next);
  }

  const showSuggestions = text.trim() !== "" && text === debounced;
  const items = suggestions.data?.items ?? [];

  return (
    <Box component="form" role="search" onSubmit={submit} sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        label="Search this folder"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        slotProps={{
          htmlInput: {
            role: "combobox",
            "aria-autocomplete": "list",
            "aria-expanded": showSuggestions,
            "aria-controls": "folder-search-list",
          },
        }}
      />
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Button
          type="button"
          aria-pressed={match === "PREFIX"}
          onClick={() => {
            selectMatch("PREFIX");
          }}
        >
          Starts with
        </Button>
        <Button
          type="button"
          aria-pressed={match === "EXACT"}
          onClick={() => {
            selectMatch("EXACT");
          }}
        >
          Exact name
        </Button>
      </Box>
      {showSuggestions ? (
        <SuggestionList
          loading={suggestions.isLoading}
          failed={suggestions.isError}
          items={items}
        />
      ) : null}
    </Box>
  );
}

function SuggestionList({
  loading,
  failed,
  items,
}: {
  loading: boolean;
  failed: boolean;
  items: {
    id: NodeId;
    parentId: NodeId | null;
    kind: NodeKind;
    name: string;
  }[];
}) {
  if (loading) {
    return <Typography role="status">Searching</Typography>;
  }
  if (failed) {
    return <Typography>Search failed.</Typography>;
  }
  if (items.length === 0) {
    return <Typography>No matches.</Typography>;
  }
  return (
    <List
      id="folder-search-list"
      role="listbox"
      aria-label="Search suggestions"
    >
      {items.map((node) => (
        <ListItem key={node.id} disablePadding>
          <ListItemButton
            component={RouterLink}
            to={parentFolderPath(node)}
            role="option"
          >
            <ListItemText
              primary={node.name}
              secondary={kindLabel(node.kind)}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
