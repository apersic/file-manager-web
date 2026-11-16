import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "@/app/provider";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("Root element #root is missing");
}

createRoot(root).render(
  <StrictMode>
    <AppProvider />
  </StrictMode>,
);
