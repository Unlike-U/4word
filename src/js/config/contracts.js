export const CONTRACTS = {
  MESSAGE_STORAGE: {
    address: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    abi: [
      "function registerUsername(string memory username) external",
      "function storeMessage(string memory senderUsername, string memory receiver, string memory encryptedContent, bool rsaEncrypted, bool manuallyEncrypted) external returns (uint256)",
      "function getMessageCount() external view returns (uint256)",
      "function getMessage(uint256 messageId) external view returns (address sender, string memory senderUsername, string memory receiver, string memory encryptedContent, uint256 timestamp, bool rsaEncrypted, bool manuallyEncrypted)",
      "function getMessagesForReceiver(string memory receiverUsername) external view returns (uint256[] memory)",
      "function getPublicMessages() external view returns (uint256[] memory)",
      "function usernameToAddress(string) external view returns (address)",
      "event MessageStored(uint256 indexed messageId, address indexed sender, string senderUsername, string receiver, uint256 timestamp)"
    ]
  }
};

export const NETWORKS = {
  BASE: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  },
  BASE_SEPOLIA: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org']
  }
};

export const CURRENT_NETWORK = process.env.NODE_ENV === 'production' 
  ? NETWORKS.BASE 
  : NETWORKS.BASE_SEPOLIA;
