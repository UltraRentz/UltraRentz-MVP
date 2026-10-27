# UltraRentz — CTO Master Brief

**Last updated:** 13 September 2026
**Status:** Post-ETHOnline sprint. Targeting relaunch 17 September.

---

## 1. The thesis

No renter anywhere on Earth earns yield on their rent deposit or rent float. UltraRentz pools that idle capital, generates safe yield on it, and splits the return between tenant, landlord, and platform — with automated, non-discretionary return of the deposit at tenancy end.

**Market sequencing:**
- **UK** — test/proof-of-mechanism market only. UK law requires tenancy deposits to sit in a government-approved scheme (DPS/mydeposits/TDS); real-money deployment here is illegal without that approval. UK cohort (40 University of Hertfordshire students) runs on **test tokens only**, framed explicitly as a demo/simulation.
- **Ireland** — first real commercial market. Less rigid deposit-scheme mandate than the UK, and the standard EU base for an EMI (E-Money Institution) licence with passporting rights — a single Irish licence could unlock the whole EU.
- **EU → South America → global tier-2** (Switzerland 61% renters, Germany, Austria, etc.) — sequenced expansion after Ireland proves the model.

**Reverse-engineered scale target:** ~£1B valuation by April 2032 requires roughly 2–4 million active tenancies under management generating £25–50M ARR at a 20–30x infrastructure-fintech multiple — not 2,700 UK demo homes. That figure is Milestone 1 of roughly 8, not the end state.

---

## 2. What exists right now (as of tonight)

**Smart contract — `RentDepositVault.sol`**
Lease-scoped USDC escrow. Reviewed and confirmed coherent:
- `pendingYield(leaseId)` — public view function, simple 5% APY (`YIELD_RATE_BPS = 500`) over elapsed time, capped at lease end. Provably accurate, live-pollable.
- Two-step release: `requestRelease()` (AI agent only, cannot choose recipient/amount) → `executeRelease()` (callable by anyone) after a mandatory **1-hour `AGENT_DELAY`** safety window.
- Landlord claims require a hashed evidence submission — burden of proof is on the landlord, not the tenant.
- Disputed claims resolved by a named arbiter; the arbiter's split is immutable once recorded.
- Yield currently paid from an owner-funded on-chain reserve — an explicit, documented placeholder for a real lending-protocol integration (Aave V4 is in active governance review for deployment on Arc).

**Deployed tonight — Arc Testnet**
- Contract address: `0xDc7F1A35181C2d607F79616Ab48D81d1144d9244`
- USDC (Arc testnet): `0x3600000000000000000000000000000000000000`
- Deploy tx: `0x58b769ae359c6b9f1f51f24c55fce35908392e1f40d077f0aa56610e1a293304`
- Lease ID 1 created and funded (10 USDC) — tx `0x6e46df559352eb9bb2a4eae70aa45f86007cc1f193f13e1f317c5ec820710c26`
- `requestRelease` triggered; 1-hour delay in progress as of pausing tonight — **`executeRelease` still needs to be confirmed working**, this is the one open technical unknown.

**Frontend**
Rebuilt today from a broken state (dead Privy import, dead Arbitrum/Particle Network config, a contract ABI mismatch pointing at an unrelated Aave/Arbitrum prototype). Now a clean, minimal flow directly on `ethers.js`:
Connect wallet → fund deposit → live yield ticker (new feature, polls `pendingYield` every 5s) → request release → execute release.

**Branching**
Work is on `xrent-arc`, separate from `xrent` (already submitted to the Flare hackathon, left untouched) and `main`.

---

## 3. Key lessons from today (worth remembering, not repeating)

- **This repo had three generations of the project layered on top of each other** — a Privy-based auth attempt, an Arbitrum/Particle Network pivot, and an Aave/Arbitrum-mainnet prototype contract — all partially present simultaneously. None of this was obvious from file names alone. Before the next work session, a deliberate repo cleanup (delete dead files, reconcile branches) will prevent this from costing hours again.
- **`DeployURZ.s.sol`, `DepositForm.tsx`, `YieldCalculatorHero.tsx`** are confirmed dead/unused — safe to delete when there's time.
- **Yield mechanism is deliberately lending-style, not AMM/LP-based** — principal preservation is non-negotiable for a rent deposit product; this was a considered decision, not a default.
- **The 1-hour release delay is a security feature, not a UX flaw** — worth stating explicitly in any demo or investor conversation, since it's the difference between "automated" and "automated safely."
- **Real Aave V4 integration is a genuine near-term roadmap item**, not vapourware — Aave Labs has an active governance proposal to deploy V4 on Arc, and a community implementation ("Aarce") already exists live on Arc testnet for early experimentation.

---

## 4. Immediate next steps → 17 September launch

1. Confirm `executeRelease` pays out correctly once the delay elapses (tonight or first thing tomorrow) — the one unverified link in the chain.
2. Delete confirmed-dead files; reconcile which branch becomes the real `main` going forward.
3. Decide UK demo-cohort framing is airtight (test-token labeling, no financial-promotion risk) ahead of any wider student-facing push.
4. Revisit frontend polish — today's build proves the mechanism, not the final UX.
5. Dublin trip prep (EMI/BaaS partner conversation remains the single highest-leverage meeting on the calendar) stays on track for late September, independent of today's ETHOnline outcome.

---

## 5. The bigger picture

Today didn't produce a hackathon submission — it produced a **verified, working, honestly-understood core product** on the chain that matters (Arc, USDC-native), with the dead ends found and marked rather than silently shipped. That's the harder and more valuable outcome. The YC deadline (Nov 2) and the Ireland pilot are unaffected by today's decision not to submit, and are still the real path to unicorn scale.