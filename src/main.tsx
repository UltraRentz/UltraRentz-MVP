// src/main.tsx (FINAL FIX)

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
// 💡 REQUIRED IMPORT: Wagmi chain objects for network configuration
import { polygonMumbai } from 'wagmi/chains'; 

import App from "./App";
import "./index.css";
import "./styles.css";

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
          createOnLogin: "all-users",   
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