import React from "react";
import { createRoot } from "react-dom/client";
import './index.css';
import { App } from "./App";
import { LanguageProvider } from "./components/pages/LanguageContext";

const container = document.getElementById("root");
const root = createRoot(container!); // The '!' tells TypeScript this won't be null
root.render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
