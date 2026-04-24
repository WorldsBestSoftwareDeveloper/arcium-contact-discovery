# PrivFind — Private Contact Discovery

> Find your friends without exposing your contacts.  
> Powered by **Arcium** encrypted compute · **Solana** wallet identity

---

Web url ==> https://privfind.vercel.app/
video ==> https://youtu.be/6n2jNNnMeU0?si=saStkNj4iVr8JIu2
## Overview

PrivFind is a privacy-preserving contact discovery app built with:

- **Arcium** — Multi-Party Computation (MPC) for encrypted Private Set Intersection
- **Solana** — Wallet-based user identity (devnet)
- **Next.js 14** — App Router + TypeScript
- **TailwindCSS** — Dark mode UI

No raw contact data is ever uploaded. Only mutual matches are revealed.

---

## How It Works

```
User A contacts          User B contacts
       ↓                        ↓
  Normalize + Hash          Normalize + Hash
  (client-side)             (client-side)
       ↓                        ↓
  Arcium Encrypt            Arcium Encrypt
       ↓                        ↓
         ──── Arcium PSI Compute ────
              (inside secure enclave)
                      ↓
              Intersection hashes only
                      ↓
              Map back to contacts
```

1. **Hash** — contacts are SHA-256 hashed on-device before transmission
2. **Encrypt** — hashes are encrypted with Arcium's public key
3. **Compute** — Arcium runs PSI inside encrypted enclaves; no server sees plaintext
4. **Reveal** — only the intersection of both sets is returned

---

## Setup

### Prerequisites

- Node.js 18+
- Phantom or Solflare wallet (set to **Devnet**)
- Arcium API key ([get one at arcium.com](https://arcium.com))

### Install

```bash
git clone <repo>
cd arcium-contact-discovery
npm install
```

### Configure

Copy `.env.local` and fill in your credentials:

```bash
cp .env.local .env.local.real
```

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_ARCIUM_API_URL=https://api.arcium.com
ARCIUM_API_KEY=your_arcium_api_key_here
```

### Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── layout.tsx                    # Root layout + wallet provider
├── page.tsx                      # Home page (Hero + Dashboard + HowItWorks)
├── globals.css                   # Global styles + custom fonts
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Top nav with wallet connect
│   │   └── WalletProvider.tsx    # Solana wallet adapter setup
│   │
│   └── features/
│       ├── Hero.tsx              # Landing section + connect CTA
│       ├── Dashboard.tsx         # Main app orchestrator
│       ├── ContactInput.tsx      # Paste / manual / CSV input
│       ├── ComputeProgress.tsx   # Arcium phase visualization
│       ├── MatchResults.tsx      # Results display + copy
│       └── HowItWorks.tsx        # Privacy explainer
│
├── hooks/
│   └── usePSI.ts                 # PSI orchestration hook
│
└── lib/
    ├── arcium/
    │   └── client.ts             # Arcium SDK: encrypt, submit, poll
    ├── solana/
    │   └── config.ts             # Solana devnet config + utilities
    └── utils/
        └── contacts.ts           # Normalize, hash, parse, resolve
```

---

## API Reference

### `app/lib/arcium/client.ts`

| Function | Description |
|---|---|
| `encryptContactHashes(hashes, walletKey)` | Encrypts a hash array with Arcium |
| `submitPSIJob(request)` | Submits encrypted PSI compute job |
| `getPSIJobResult(jobId)` | Polls job status from Arcium |
| `waitForPSIResult(jobId, onProgress)` | Polls until completion with backoff |
| `checkArciumConnection()` | Health checks the Arcium API |

### `app/lib/utils/contacts.ts`

| Function | Description |
|---|---|
| `processContacts(rawInputs)` | Full pipeline: normalize → dedupe → hash |
| `normalizeEmail(email)` | Lowercase + trim |
| `normalizePhone(phone)` | E.164 format |
| `sha256(input)` | Web Crypto SHA-256 |
| `resolveMatchedContacts(contacts, hashes)` | Map hashes → Contact objects |
| `parseContactList(text)` | Parse newline/comma separated |
| `parseContactCSV(csv)` | Parse first column of CSV |
| `obfuscateContact(contact)` | `a***@domain.com` style masking |

---

## Privacy Guarantees

- ✅ Raw contacts never leave the device
- ✅ Only SHA-256 hashes are transmitted (after encryption)
- ✅ Arcium compute nodes process ciphertext only
- ✅ Non-matching contacts are never revealed to either party
- ✅ No central server stores contact data
- ✅ Deterministic hashing enables matching without sharing raw data

---

## Devnet Testing

Use the **Devnet test helpers** in the Dashboard to load sample contact sets:

- **My Sample**: alice@example.com, bob@gmail.com, +14155552671, carol@web3.io, dave@test.com
- **Partner Sample**: bob@gmail.com, carol@web3.io, frank@example.com, +14155559999, grace@solana.dev
- **Expected matches**: bob@gmail.com, carol@web3.io (2 mutual contacts)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Encrypted Compute | Arcium MPC / PSI |
| Wallet | Solana Wallet Adapter (Phantom, Solflare) |
| Hashing | Web Crypto API (SHA-256) |
| Network | Solana Devnet |

---

## Deployment

```bash
npm run build
npm start
```

For production, set `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta` and update the RPC URL.

---

## License

MIT
