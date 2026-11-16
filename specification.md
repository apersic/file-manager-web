# Specification

The browser for the file manager. A file is a name plus `createdAt` and `updatedAt`. It has no bytes. There is no login.

This build is the shell. It does not list folders, create nodes, search, or delete. The request and response shapes are the API's. They are in [file-manager-api/specification.md](../file-manager-api/specification.md). This UI does not define a second contract.

## This build

- `/` says browsing is not implemented yet and links to this file.
- Any other path is a local 404, with a link back to `/`.
- A render failure shows its own page. It is not the 404.
- The API base URL is `VITE_API_URL`. When that variable is unset, the client uses `http://localhost:8080`.
- A successful response is the JSON body.
- A failure becomes one toast. The client reads the error envelope (`message`, `status`, `error`, `timestamp`, `path`) and the 400 field map (field name to message).
- A 401 stays on the current page. There is no login redirect.
- Server data, once a page asks for it, lives only in TanStack Query. Queries stay fresh for 30 seconds. A query retries at most twice, and only for a network failure or an HTTP 500. Mutations do not retry.
- The dev server listens on port 5173 and refuses another port, matching the API CORS default.

## Planned behavior

The folder id will live in the URL. `/` will load Home from `GET /api/v1/nodes/root` and redirect to `/folders/:folderId`. That page will show breadcrumbs and a keyset list with Load more. Refresh keeps the folder. A malformed id does not call the API.

Creating a folder or a file sends `parentId`, `kind`, and `name`. A 400 field map is shown on the form. Any other failure stays on the toast. After 201, the parent list is invalidated. After 409, the parent list is refetched. There is no client idempotency key.

Search text stays in the component until Enter, or a `/search` URL, runs the query. Typing uses a 250 ms debounce, `match=PREFIX`, and `limit=10`. A blank box does not call the API. Picking a suggestion opens that entry's parent folder.

Deleting a folder asks for confirmation and says the delete removes everything inside it. The row disappears when the server confirms. A 404 after a delete is treated as already gone.

## Layout

`app`, `components`, `config`, and `lib` are shared. `features` appears only when a feature exists. There are no barrel files. Shared code does not import `features` or `app`. Features do not import `app` or each other.

## Still unfinished

- No folder list, breadcrumbs, or Load more.
- No create dialog.
- No search box.
- No delete action.
- No MSW.
