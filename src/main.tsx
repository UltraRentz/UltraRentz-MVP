

import { StrictMode } from "react";
import { Buffer } from "buffer";
// Polyfill Buffer for browser
if (!(window).Buffer) (window).Buffer = Buffer;
import { createRoot } from "react-dom/client";

import App from "./App";
import './styles.css';



// Force dark theme on html at runtime
document.documentElement.setAttribute('data-theme', 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);