import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Dashboard from "./lib/Dashboard.jsx";
import Incidents from "./lib/Incidents.jsx";
import Risk from "./lib/Risk.jsx";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <App/>, children: [
    { index: true, element: <Dashboard/> },
    { path: "incidents", element: <Incidents/> },
    { path: "risk", element: <Risk/> },
  ]}
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode><RouterProvider router={router}/></React.StrictMode>
);
