4word/
├── contracts/                    # Smart Contracts
│   ├── MessageStorage.sol
│   ├── deploy.js
│   └── hardhat.config.js
│
├── backend/                      # Backend Server (Oracle VNC)
│   ├── server.js
│   ├── routes/
│   │   └── messages.js
│   ├── models/
│   │   └── Message.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── cleanup.js
│   ├── package.json
│   └── .env
│
├── src/                          # Frontend (IPFS)
│   ├── index.html
│   ├── js/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── LoginForm.js
│   │   │   ├── MainApp.js
│   │   │   ├── ChatView.js
│   │   │   ├── WalletConnector.js
│   │   │   └── SteganographyView.js
│   │   ├── services/
│   │   │   ├── KeyPairManager.js
│   │   │   ├── Web3Service.js
│   │   │   ├── BackendService.js
│   │   │   ├── AdvancedSteganography.js
│   │   │   └── encryption.js
│   │   ├── managers/
│   │   │   ├── StateManager.js
│   │   │   └── MessageManager.js
│   │   ├── utils/
│   │   │   └── EventBus.js
│   │   ├── constants/
│   │   │   └── events.js
│   │   └── config/
│   │       ├── contracts.js
│   │       └── backend.js
│   ├── styles/
│   │   └── main.scss
│   └── data/
│       └── initialUsers.json
│
├── dist/                         # Build output (deploy to IPFS)
├── package.json
├── webpack.config.js
├── .env
└── README.md
