import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import { useDeleteNode } from "@/features/file-manager/delete-node";
import { type NodeKind, type NodeSummary } from "@/features/file-manager/node";

function deleteTitle(kind: NodeKind): string {
  switch (kind) {
    case "FOLDER":
      return "Delete folder";
    case "FILE":
      return "Delete file";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function deleteMessage(node: NodeSummary): string {
  switch (node.kind) {
    case "FOLDER":
      return `Delete ${node.name}? This deletes everything inside it.`;
    case "FILE":
      return `Delete ${node.name}?`;
    default: {
      const unreachable: never = node.kind;
      return unreachable;
    }
  }
}

export function DeleteNodeButton({ node }: { node: NodeSummary }) {
  const [open, setOpen] = useState(false);
  const remove = useDeleteNode();

  function close() {
    if (remove.isPending) {
      return;
    }
    setOpen(false);
  }

  async function confirm() {
    try {
      await remove.mutateAsync({ id: node.id, parentId: node.parentId });
    } catch {
      setOpen(false);
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        aria-label={`Delete ${node.name}`}
        onClick={() => {
          setOpen(true);
        }}
      >
        Delete
      </Button>
      <Dialog open={open} onClose={close}>
        <DialogTitle>{deleteTitle(node.kind)}</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteMessage(node)}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={close} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              void confirm();
            }}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Deleting" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
