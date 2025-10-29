┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (IPFS Hosted Static Files)            │
│  ├─ HTML/CSS/JS (no server needed)                          │
│  ├─ Web3 integration (ethers.js)                            │
│  ├─ Connects to MetaMask/WalletConnect                      │
│  └─ Makes API calls to backend & blockchain                 │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │    BASE      │    │   BACKEND    │    │  BROWSER     │
   │  BLOCKCHAIN  │    │   SERVER     │    │ localStorage │
   │              │    │ (Oracle VNC) │    │              │
   │ • Permanent  │    │ • Temporary  │    │ • Keys       │
   │   Messages   │    │   (24-48h)   │    │ • Cache      │
   │ • Costs Gas  │    │ • Self-      │    │              │
   │ • Immutable  │    │   Destruct   │    │              │
   │ • Public     │    │   (12-24h)   │    │              │
   └──────────────┘    └──────────────┘    └──────────────┘
