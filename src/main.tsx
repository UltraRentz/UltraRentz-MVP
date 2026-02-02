

import { StrictMode } from "react";
import { Buffer } from "buffer";
// Polyfill Buffer for browser
if (!(window).Buffer) (window).Buffer = Buffer;
import * as Sentry from "@sentry/react";
// Use browserTracingIntegration for Sentry v8+
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
// 💡 REQUIRED IMPORT: Wagmi chain objects for network configuration
import { polygonMumbai } from 'wagmi/chains'; 

import App from "./App";
import './styles.css';



// Force dark theme on html at runtime
document.documentElement.setAttribute('data-theme', 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);