import React from "react";
import ReactDOM from "react-dom/client";
import "src/index.css";
import App from "src/App";
import Home from "src/components/Home";
import reportWebVitals from "src/reportWebVitals";
import NotificationTemplate from "src/components/NotificationTemplate";
import GrokDebugger from "src/components/GrokDebugger";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Home />} />
      <Route path="grok" element={<GrokDebugger />} />
      <Route path="notifications" element={<NotificationTemplate />} />
      <Route path="parser" element={<div>Not done</div>} />
      <Route path="scenario" element={<div>Not done</div>} />
    </Route>,
  ),
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

reportWebVitals();
