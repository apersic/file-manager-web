import { copyFileSync, createReadStream, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Connect, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const specificationFile = path.resolve(webRoot, "specification.md");

function serveSpecification(middlewares: Connect.Server): void {
  middlewares.use("/specification.md", (_request, response) => {
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    createReadStream(specificationFile).pipe(response);
  });
}

function specificationPlugin(): Plugin {
  return {
    name: "file-manager-specification",
    configureServer(server) {
      serveSpecification(server.middlewares);
    },
    configurePreviewServer(server) {
      serveSpecification(server.middlewares);
    },
    writeBundle(output) {
      const directory = output.dir;
      if (directory === undefined) {
        throw new Error("The build output directory is missing");
      }
      mkdirSync(directory, { recursive: true });
      copyFileSync(specificationFile, path.join(directory, "specification.md"));
    },
  };
}

export default defineConfig({
  plugins: [react(), tsconfigPaths(), specificationPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    env: {
      VITE_API_URL: "http://127.0.0.1:8080",
    },
  },
});
