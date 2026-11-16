# Specification

The browser for the file manager. A file is a name plus `createdAt` and `updatedAt`. It has no bytes. There is no login.

This build browses folders, creates files and folders, and searches by name. It does not delete. The request and response shapes are the API's. They are in [file-manager-api/specification.md](../file-manager-api/specification.md). This UI does not define a second contract.

## This build

- `/` loads Home from `GET /api/v1/nodes/root` and redirects to `/folders/:folderId`.
- That page shows breadcrumbs and the children of the folder. Load more asks for the next page. The first request omits `cursor` and `limit`. The next request sends the `nextCursor` from the previous page. Refresh keeps the folder because the id is in the URL.
- A folder with no children says "This folder is empty."
- A missing folder and a malformed id both say the folder was not found. A malformed id does not call the API.
- Opening a file id shows that file and does not ask for children. A file page has no create actions.
- A folder page has New folder and New file. Each opens a dialog and sends `parentId`, `kind`, and `name`. There is no idempotency key.
- A 400 field map is shown on that form and is not toasted. Any other failure stays on the toast.
- After 201, the parent list is invalidated. After 409, the parent list is refetched so the existing name shows up.
- A folder page has a search box. The typed text stays in the component. After 250 ms, a non-blank value calls `GET /api/v1/nodes/search` with `match=PREFIX`, `limit=10`, and that folder as `parentId`. A blank box does not call the API. `%` and `_` are sent as typed.
- Starts with or Exact name, then Enter, opens `/search` with `q`, `match`, and `parentId` in the URL. A shared `/search` URL runs that query. Omit `parentId` to search the whole tree. A malformed folder id does not call the API.
- Picking a suggestion or a result opens that entry's parent folder.
- Any other path is a local 404, with a link back to `/`.
- A render failure shows its own page. It is not the 404.
- The API base URL is `VITE_API_URL`. When that variable is unset, the client uses `http://localhost:8080`.
- A successful response is the JSON body.
- A failure becomes one toast, except a 400 field map on create, which the form shows instead. The client reads the error envelope (`message`, `status`, `error`, `timestamp`, `path`) and the 400 field map (field name to message).
- A 401 stays on the current page. There is no login redirect.
- Server data, once a page asks for it, lives only in TanStack Query. Queries stay fresh for 30 seconds. A query retries at most twice, and only for a network failure or an HTTP 500. Mutations do not retry.
- The dev server listens on port 5173 and refuses another port, matching the API CORS default.

## Planned behavior

Deleting a folder asks for confirmation and says the delete removes everything inside it. The row disappears when the server confirms. A 404 after a delete is treated as already gone.

## Layout

`app`, `components`, `config`, and `lib` are shared. `features` appears only when a feature exists. There are no barrel files. Shared code does not import `features` or `app`. Features do not import `app` or each other.

## Still unfinished

- No delete action.
