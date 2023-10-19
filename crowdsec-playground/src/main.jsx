import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Home from "./components/Home";
import reportWebVitals from "./reportWebVitals";
import NotificationTemplate from "./components/NotificationTemplate";
import GrokDebugger from "./components/GrokDebugger";

import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import ErrorBoundary from "./components/errorBoundary";

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Home />} errorElement={ErrorBoundary} />
      <Route
        path="grok"
        element={<GrokDebugger />}
        errorElement={ErrorBoundary}
      />
      <Route
        path="notifications"
        element={<NotificationTemplate />}
        errorElement={ErrorBoundary}
      />
      <Route
        path="parser"
        element={<div>Not done</div>}
        errorElement={ErrorBoundary}
      />
      <Route
        path="scenario"
        element={<div>Not done</div>}
        errorElement={ErrorBoundary}
      />
    </Route>,
  ),
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

reportWebVitals();
