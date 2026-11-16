import Typography from "@mui/material/Typography";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useParams } from "react-router";
import { Page } from "@/components/page";
import { FolderBreadcrumbs } from "@/features/file-manager/breadcrumbs";
import { CreateNodeControls } from "@/features/file-manager/create-node-dialog";
import { EmptyFolder } from "@/features/file-manager/empty-folder";
import { childrenQueryOptions } from "@/features/file-manager/get-children";
import { nodeQueryOptions } from "@/features/file-manager/get-node";
import {
  parseFolderId,
  type NodeDetail,
  type NodeId,
} from "@/features/file-manager/node";
import { NodeList } from "@/features/file-manager/node-list";
import { SearchBox } from "@/features/file-manager/search-box";

export function FolderPage() {
  const params = useParams();
  const folderId = parseFolderId(params.folderId);
  if (folderId === null) {
    return <MissingFolder />;
  }
  return <LoadedFolder id={folderId} />;
}

function MissingFolder() {
  return (
    <Page title="Folder not found">
      <Typography>This folder does not exist.</Typography>
    </Page>
  );
}

function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

function LoadedFolder({ id }: { id: NodeId }) {
  const nodeQuery = useQuery(nodeQueryOptions(id));

  if (nodeQuery.isLoading) {
    return (
      <Page title="File manager">
        <Typography role="status">Loading folder</Typography>
      </Page>
    );
  }

  if (nodeQuery.isError) {
    if (isNotFound(nodeQuery.error)) {
      return <MissingFolder />;
    }
    return (
      <Page title="File manager">
        <Typography>This folder could not be loaded.</Typography>
      </Page>
    );
  }

  if (nodeQuery.data === undefined) {
    return <MissingFolder />;
  }

  return (
    <Page title={nodeQuery.data.name}>
      <FolderBreadcrumbs
        ancestors={nodeQuery.data.ancestors}
        current={nodeQuery.data}
      />
      <FolderBody node={nodeQuery.data} />
    </Page>
  );
}

function FolderBody({ node }: { node: NodeDetail }) {
  switch (node.kind) {
    case "FILE":
      return <Typography>This is a file.</Typography>;
    case "FOLDER":
      return <FolderContents parentId={node.id} />;
    default: {
      const unreachable: never = node.kind;
      return unreachable;
    }
  }
}

function FolderContents({ parentId }: { parentId: NodeId }) {
  return (
    <>
      <SearchBox parentId={parentId} />
      <CreateNodeControls parentId={parentId} />
      <FolderChildren parentId={parentId} />
    </>
  );
}

function FolderChildren({ parentId }: { parentId: NodeId }) {
  const childrenQuery = useInfiniteQuery(childrenQueryOptions(parentId));
  const items = childrenQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (childrenQuery.isLoading) {
    return <Typography role="status">Loading folder</Typography>;
  }

  if (childrenQuery.isError) {
    return <Typography>The folder list could not be loaded.</Typography>;
  }

  if (items.length === 0) {
    return <EmptyFolder />;
  }

  return (
    <NodeList
      items={items}
      hasNextPage={childrenQuery.hasNextPage === true}
      isLoadingMore={childrenQuery.isFetchingNextPage}
      onLoadMore={() => {
        void childrenQuery.fetchNextPage();
      }}
    />
  );
}
