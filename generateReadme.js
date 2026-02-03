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
- 🖊️ **Multi-signatory escrow system** (4 of 6 must approve for release)  
- 🧍‍♂️🧍‍♀️ Renter and Landlord each nominate 3 signatories  
- 🪙 ERC-20 URZ Token deployed on **Moonbase Alpha**  
- 💳 Fiat ↔ Token swap integration (coming soon)  
- 🌕 MetaMask wallet integration  
- 📅 Automatic tenancy end date calculation  
- ⚖️ On-chain arbitration logic (DAO-based dispute resolution)  
- 📊 Future: staking + yield features  

---

## 📂 Branch Workflow
- **main** → Stable, production-ready code  
- **feature/escrow-contract** → Core escrow contract development  
- **feature/dispute-resolution** → DAO arbitration logic  
- **ui-tweak** → Frontend styling and UX adjustments  

Developers should branch off features and open pull requests into the relevant feature branch. Merges into \`main\` happen after review + testing.  

---

## 💸 Contract Addresses
- **URZ Token**: ${contracts.URZToken}  
- **Escrow**: ${contracts.Escrow} (update after deployment)  

---

## 🔨 Deploy Contracts
1. Compile contracts:  
\`\`\`bash
npx hardhat compile
\`\`\`

2. Deploy to Moonbase Alpha:  
\`\`\`bash
npx hardhat run scripts/deploy.js --network moonbase
\`\`\`

3. Update addresses in \`generateReadme.js\` to keep README in sync.  

---

## 🧪 Running Tests
\`\`\`bash
npx hardhat test
npm run test
\`\`\`

---

## 🏗️ Frontend Components
The project includes the following key React components:

${componentFiles.map((file) => `- ${file}`).join("\n") || "- No components found"}

---

## 🛠️ Tech Stack
- Solidity (Smart Contracts)  
- ethers.js (Ethereum Interaction)  
- React + TypeScript (Frontend)  
- Vite (Build Tool)  
- Hardhat (Testing + Deployment)  
- Moonbase Alpha (Moonbeam Testnet)  
- MetaMask (Wallet Integration)  

---

## 🔒 Security
- ✅ ReentrancyGuard enabled  
- ✅ Multisig-controlled fund release  
- 🔜 Formal audit planned before mainnet launch  

---

## 📅 Roadmap
- **MVP Launch (Q4 2025)**: Escrow + multisig deposit release  
- **Phase 2 (2026)**: DAO arbitration, staking & yield  
- **Phase 3**: Cross-border deposits, fiat ↔ crypto swaps  

---

## 👥 Community
- Twitter: [@UltraRentz](https://twitter.com)  
- Discord: (coming soon)  
- Newsletter: (coming soon)  

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
