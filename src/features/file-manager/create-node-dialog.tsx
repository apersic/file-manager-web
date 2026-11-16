import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { describeFailure } from "@/lib/api-failure";
import { useCreateNode } from "@/features/file-manager/create-node";
import { type NodeId, type NodeKind } from "@/features/file-manager/node";

type CreateNodeControlsProps = {
  parentId: NodeId;
};

function dialogTitle(kind: NodeKind): string {
  switch (kind) {
    case "FOLDER":
      return "New folder";
    case "FILE":
      return "New file";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

export function CreateNodeControls({ parentId }: CreateNodeControlsProps) {
  const create = useCreateNode(parentId);
  const [kind, setKind] = useState<NodeKind | null>(null);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<Record<string, string> | null>(null);

  function open(next: NodeKind) {
    setKind(next);
    setName("");
    setFields(null);
  }

  function close() {
    if (create.isPending) {
      return;
    }
    setKind(null);
    setName("");
    setFields(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kind === null) {
      return;
    }
    setFields(null);
    try {
      await create.mutateAsync({ kind, name });
    } catch (error: unknown) {
      const failure = describeFailure(error);
      if (failure.kind === "fields") {
        setFields(failure.fields);
      }
      return;
    }
    setKind(null);
    setName("");
    setFields(null);
  }

  const nameError = fields?.name;
  const otherFields = Object.entries(fields ?? {}).filter(
    ([field]) => field !== "name",
  );

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          type="button"
          variant="contained"
          onClick={() => {
            open("FOLDER");
          }}
        >
          New folder
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={() => {
            open("FILE");
          }}
        >
          New file
        </Button>
      </Stack>
      <Dialog open={kind !== null} onClose={close}>
        {kind === null ? null : (
          <form onSubmit={(event) => void submit(event)}>
            <DialogTitle>{dialogTitle(kind)}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                fullWidth
                margin="dense"
                name="name"
                autoComplete="off"
                label="Name"
                value={name}
                error={nameError !== undefined}
                helperText={nameError}
                onChange={(event) => {
                  setName(event.target.value);
                  setFields(null);
                }}
              />
              {otherFields.map(([field, message]) => (
                <Typography key={field} color="error">
                  {field}: {message}
                </Typography>
              ))}
            </DialogContent>
            <DialogActions>
              <Button type="button" onClick={close} disabled={create.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={create.isPending}
              >
                {create.isPending ? "Creating" : "Create"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </>
  );
}
