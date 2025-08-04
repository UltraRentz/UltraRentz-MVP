# 🏡 UltraRentz-MVP

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

## 🔧 Partner Tools Used

- **Etherlink** — Deployed the UltraRentz Escrow contract and integrated blockchain infrastructure for fast, secure transactions on a Layer 2 testnet.  
- **Thirdweb** — Assisted with contract management and deployment scripts.  
- **Sequence** — Used for wallet connection and user onboarding flows.  
- **RedStone** — Integrated decentralized oracle data feeds for token price validation (planned/partial).  
- **Goldsky** — Utilized for off-chain data querying and analytics (planned).  
- **Google Cloud** — Hosting frontend and backend services supporting the dApp UI and API endpoints.

---

## 💸 How to Pay with URZ

1. Connect your MetaMask wallet to the **Moonbase Alpha** testnet.  
2. Add the URZ token manually to MetaMask:  
   - **Contract**: `0xB1c01f7e6980AbdbAec0472C0e1A58EB46D39f3C`  
   - **Symbol**: `URZ`  
   - **Decimals**: `18`  
3. Choose **Token** mode in the deposit form.  
4. Enter:  
   - Deposit amount (in URZ)  
   - Tenancy start date  
   - Tenancy duration (in months)  
   - Landlord wallet address  
5. Click **Pay Token** to confirm the payment on-chain.

---

## ✍️ How to Add Signatories

1. Scroll to the **Signatories Section**.  
2. Add **3 signatory emails or wallet addresses** under both Renter and Landlord.  
3. Click `Finalize Deposit & Signatories` when:  
   - URZ token payment is confirmed ✅  
   - Wallet is connected  
   - All 6 signatories are added  

---

## ⚙️ Architecture

- **Smart Contracts (Solidity):** Handles token deposits, escrow logic, and multi-sig approval.  
- **Frontend (React + TypeScript):** Modular forms for UX, built with Vite.  
- **Blockchain APIs:**  
  - Ethers.js for Ethereum/Moonbeam integration  
  - Polkadot.js API for future substrate compatibility  
- **Wallet Support:**  
  - MetaMask (Ethereum)  
  - Sequence (wallet onboarding)  

---

## 🛠️ Tech Stack

- Solidity (Smart Contracts)  
- ethers.js (Ethereum Interaction)  
- React (Frontend)  
- TypeScript (Typed JavaScript)  
- Vite (Build Tool)  
- Moonbase Alpha (Moonbeam Testnet)  
- MetaMask & Sequence (Wallet Integration)  
- Google Cloud (Hosting)

---

## 🛡️ Security Roadmap

- ✅ Manual testing of payment + signatory flow  
- 🧪 Unit tests for smart contract functions (coming soon)  
- 🔐 Integration with DAO arbitration module (planned)  
- 🔍 Smart Contract Audit by certified Web3 security expert (planned)  

---

## 👥 Contributing

We welcome collaborators! Submit pull requests or issues on GitHub.

---

## 📝 License

MIT License © Adegbenga Ogungbeje (UltraRentz)  
