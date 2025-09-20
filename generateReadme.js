const fs = require("fs");
const path = require("path");

// -------------------------
// CONFIG
// -------------------------

// Example contract addresses (update after deployment)
const contracts = {
  URZToken: "0xB1c01f7e6980AbdbAec0472C0e1A58EB46D39f3C",
  Escrow: "0xYOUR_ESCROW_CONTRACT_ADDRESS",
};

// Frontend components folder (relative to project root)
const frontendDir = path.join(__dirname, "src");

// Read all frontend component files
const componentFiles = fs.existsSync(frontendDir)
  ? fs.readdirSync(frontendDir).filter((f) => f.endsWith(".tsx"))
  : [];

// -------------------------
// README CONTENT
// -------------------------

const readmeContent = `# 🏡 UltraRentz-MVP

**Securing, Protecting, and Monetising Rent Deposits on the Blockchain.**

UltraRentz is a decentralized dApp built with **ethers.js**, **Moonbeam**, **Solidity**, and **React + TypeScript** to protect tenant rent deposits using token payments and multi-signatory approval. Landlords and renters each nominate 3 signatories, with funds released only when **4 of 6** approve — no central authority required.

---

## 🚀 Live Demo

🔗 [ultra-rentz-mvp1.vercel.app](https://ultra-rentz-mvp1.vercel.app)

---

## 🧠 Features

- 🧾 **Pay Rent Deposits** using URZ tokens  
- 🖊️ **Multi-signatory system** (4 of 6 must approve for release)  
- 🧍‍♂️🧍‍♀️ Renter and Landlord each nominate 3 signatories  
- 🪙 ERC-20 URZ Token deployed on **Moonbase Alpha**  
- 💳 Choose between **fiat** or **token** payment  
- 🌕 MetaMask wallet integration  
- 🌑 Light/Dark mode toggle  
- 📅 Automatic tenancy end date calculation  
- 🧠 On-chain arbitration logic ready for DAO integration  
- ⚙️ Built using modular TypeScript components

---

## 💸 Contract Addresses

- **URZ Token**: ${contracts.URZToken}
- **Escrow**: ${contracts.Escrow}

---

## 💻 Running the Frontend

1. **Navigate to the project root** (where \`package.json\` is located):

\`\`\`bash
cd ~/UltraRentz-MVP
\`\`\`

2. **Install dependencies**:

\`\`\`bash
npm install
\`\`\`

3. **Start the development server**:

\`\`\`bash
npm run dev
\`\`\`

4. **Open your browser** at the URL shown in the terminal (usually \`http://localhost:5173\`).

> The frontend will hot-reload as you edit TypeScript/React files.

---

## 🏗️ Frontend Components

The project includes the following key React components:

${componentFiles.map((file) => `- ${file}`).join("\n") || "- No components found"}

---

## 🛠️ Tech Stack

- Solidity (Smart Contracts)
- ethers.js (Ethereum Interaction)
- React (Frontend)
- TypeScript (Typed JavaScript)
- Vite (Build Tool)
- Moonbase Alpha (Moonbeam Testnet)
- MetaMask (Wallet Integration)

---

## 👥 Contributing

We welcome collaborators! Submit pull requests or issues on GitHub.

---

## 📝 License

MIT License © Adegbenga Ogungbeje (UltraRentz)
`;

// -------------------------
// WRITE README
// -------------------------

const outputPath = path.join(__dirname, "README.md");

fs.writeFile(outputPath, readmeContent, (err) => {
  if (err) {
    console.error("Error generating README:", err);
  } else {
    console.log("README.md successfully generated!");
  }
});
