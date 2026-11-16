import { createBrowserRouter, type RouteObject } from "react-router";
import { FolderPage } from "@/features/file-manager/folder-page";
import { HomePage } from "@/app/routes/home-page";
import { NotFoundPage } from "@/app/routes/not-found-page";
import { RouteError } from "@/app/routes/route-error";

export const routes = [
  {
    path: "/",
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "folders/:folderId", element: <FolderPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
] satisfies RouteObject[];

export const router = createBrowserRouter(routes);
