import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { ProjectList } from "./pages/ProjectList";
import { ProjectDetail } from "./pages/ProjectDetail";
import { MonitorDetail } from "./pages/MonitorDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "projects",
        element: <ProjectList />,
      },
      {
        path: "projects/:projectId",
        element: <ProjectDetail />,
      },
      {
        path: "monitors/:monitorId",
        element: <MonitorDetail />,
      },
    ],
  },
]);
