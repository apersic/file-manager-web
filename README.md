# File manager web

React app for the file tree. This build browses folders and creates files and folders. Product rules are in [specification.md](specification.md). The HTTP contract is in [file-manager-api/specification.md](../file-manager-api/specification.md).

## Setup

Install the Node.js version in `.nvmrc`. From this directory:

```powershell
npm ci
```

The client uses `http://localhost:8080` when `VITE_API_URL` is unset. Copy `.env.example` to `.env` only when the API is somewhere else.

## Dev

```powershell
npm run dev
```

The app listens on port 5173 and does not pick another port. The API allows that origin. `/` loads Home from the API and redirects to `/folders/:folderId`, so the API has to be running. Stop the server with Ctrl+C.

## Production build

```powershell
npm run build
npm run preview
```

`preview` also uses port 5173. Stop `npm run dev` first, or the preview server will refuse to start.

## Check

`npm run typecheck` checks the app and the Vite config. `npm run lint` runs ESLint. `check` runs typecheck, lint, the format check, the tests, and the production build.

```powershell
npm run typecheck
npm run check
npm run format
```

## GitHub Actions

`.github/workflows/prod_build.yaml` runs on push and pull request to `main`. It installs the Node version in `.nvmrc`, then runs `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## Not in this build

No search and no delete.
