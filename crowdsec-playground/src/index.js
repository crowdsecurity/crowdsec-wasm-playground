import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Home from './components/home/home';
import reportWebVitals from './reportWebVitals';

import {
    createBrowserRouter,
    createRoutesFromElements,
    RouterProvider,
    Route,
  } from "react-router-dom";

import NotificationTemplate from './components/notificationTemplate/notificationTemplate';
import GrokDebugger from './components/grokDebugger/grokDebugger';

const root = ReactDOM.createRoot(document.getElementById('root'));


const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<App />} >
        <Route index element={<Home />} />
        <Route path="grok" element={<GrokDebugger />} />
        <Route path="notifications" element={<NotificationTemplate />} />
        <Route path="parser" element={<div>Not done</div>} />
        <Route path="scenario" element={<div>Not done</div>} />
      </Route>
    )
  );

root.render(
    <>
    <RouterProvider router={router}>
        <App />
    </RouterProvider>
    </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
