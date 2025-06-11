import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
import { ContextMenuProvider } from "./store";

const container = document.getElementById("root");

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ContextMenuProvider>
      <App />
    </ContextMenuProvider>
  </React.StrictMode>,
);
