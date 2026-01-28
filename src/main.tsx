// src/main.tsx (FINAL FIX)

import { StrictMode } from "react";
import { Buffer } from "buffer";
// Polyfill Buffer for browser
if (!(window as any).Buffer) (window as any).Buffer = Buffer;
import * as Sentry from "@sentry/react";
// Use browserTracingIntegration for Sentry v8+
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
// 💡 REQUIRED IMPORT: Wagmi chain objects for network configuration
import { polygonMumbai } from 'wagmi/chains'; 

import App from "./App";
import "./index.css";
import "./styles.css";
// Sentry initialization
Sentry.init({
    dsn: "YOUR_SENTRY_DSN_HERE", // TODO: Replace with your actual DSN
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0, // Adjust in production
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <PrivyProvider
            appId="cmhjao0mh0065l30cr77r2jej"
            config={{
                loginMethods: ["email", "google", "wallet"],
                appearance: {
                    theme: "dark",
                    accentColor: "#4f46e5",
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "all-users",
                    },
                },
                // 🚀 CRITICAL FIX: Add supported chains and set default
                supportedChains: [
                    polygonMumbai
                ],
                defaultChain: polygonMumbai,
            }}
        >
            <App />
        </PrivyProvider>
    </StrictMode>
);