import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useInfiniteQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Link as RouterLink, useSearchParams } from "react-router";
import { Page } from "@/components/page";
import { DeleteNodeButton } from "@/features/file-manager/delete-node-button";
import { type NodeKind, type NodeSummary } from "@/features/file-manager/node";
import {
  parentFolderPath,
  readSearchRequest,
  searchQueryOptions,
  type SearchMatch,
  type SearchRequest,
} from "@/features/file-manager/search-nodes";

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

function matchLabel(match: SearchMatch): string {
  switch (match) {
    case "PREFIX":
      return "Starts with";
    case "EXACT":
      return "Exact name";
    default: {
      const unreachable: never = match;
      return unreachable;
    }
  }
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const request = readSearchRequest(params);

  function selectMatch(next: SearchMatch) {
    const updated = new URLSearchParams(params);
    updated.set("match", next);
    setParams(updated);
  }

  switch (request.status) {
    case "blank":
      return (
        <Page title="Search">
          <Typography>Enter a search.</Typography>
        </Page>
      );
    case "bad-match":
      return (
        <Page title="Search">
          <Typography>This search link is not valid.</Typography>
        </Page>
      );
    case "bad-folder":
      return (
        <Page title="Folder not found">
          <Typography>This folder does not exist.</Typography>
        </Page>
      );
    case "ready":
      return <ReadySearch request={request} onMatch={selectMatch} />;
    default: {
      const unreachable: never = request;
      return unreachable;
    }
  }
}

function ReadySearch({
  request,
  onMatch,
}: {
  request: Extract<SearchRequest, { status: "ready" }>;
  onMatch: (match: SearchMatch) => void;
}) {
  const results = useInfiniteQuery(searchQueryOptions(request));
  const items = results.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Page title="Search">
      <Typography gutterBottom>
        {matchLabel(request.match)} "{request.q}"
        {request.parentId === null ? " everywhere" : " in this folder"}
      </Typography>
      <Button
        type="button"
        aria-pressed={request.match === "PREFIX"}
        onClick={() => {
          onMatch("PREFIX");
        }}
      >
        Starts with
      </Button>
      <Button
        type="button"
        aria-pressed={request.match === "EXACT"}
        onClick={() => {
          onMatch("EXACT");
        }}
      >
        Exact name
      </Button>
      <SearchBody
        loading={results.isLoading}
        failed={results.isError}
        error={results.error}
        items={items}
        hasNextPage={results.hasNextPage === true}
        isLoadingMore={results.isFetchingNextPage}
        onLoadMore={() => {
          void results.fetchNextPage();
        }}
      />
    </Page>
  );
}

function SearchBody({
  loading,
  failed,
  error,
  items,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
}: {
  loading: boolean;
  failed: boolean;
  error: unknown;
  items: NodeSummary[];
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (loading) {
    return <Typography role="status">Searching</Typography>;
  }
  if (failed) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <Typography>This folder does not exist.</Typography>;
    }
    return <Typography>Search failed.</Typography>;
  }
  if (items.length === 0) {
    return <Typography>No matches.</Typography>;
  }
  return (
    <>
      <List aria-label="Search results">
        {items.map((node) => (
          <ListItem
            key={node.id}
            secondaryAction={<DeleteNodeButton node={node} />}
          >
            <ListItemButton component={RouterLink} to={parentFolderPath(node)}>
              <ListItemText
                primary={node.name}
                secondary={kindLabel(node.kind)}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {hasNextPage ? (
        <Button type="button" disabled={isLoadingMore} onClick={onLoadMore}>
          {isLoadingMore ? "Loading" : "Load more"}
        </Button>
      ) : null}
    </>
  );
}
