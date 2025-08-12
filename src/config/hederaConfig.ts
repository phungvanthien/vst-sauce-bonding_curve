// Hedera Configuration
export const HEDERA_CONFIG = {
  // Network Configuration
  network: {
    name: 'Hedera Mainnet', // hoặc 'Hedera Mainnet'
    chainId: 295, // Testnet: 296, Mainnet: 295
    mirrorNode: 'https://mainnet-public.mirrornode.hedera.com', // Mainnet Mirror Node
    // Hedera JSON-RPC Relay (Hashio). For Testnet use: https://testnet.hashio.io/api
    rpcUrl: 'https://mainnet.hashio.io/api'
  },

  // Smart Contract Addresses (Hedera Contract IDs)
  contracts: {
    // Đọc từ .env file - hỗ trợ cả 2 format
    vaultContractId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VAULT_ADDRESS) || (typeof import.meta !== 'undefined' && import.meta.env?.VAULT_ADDRESS) || '0.0.9589598', // Vault contract ID
    tokenContractId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TOKEN_ADDRESS) || (typeof import.meta !== 'undefined' && import.meta.env?.TOKEN_ADDRESS) || '0.0.456858', // Real USDC token on Hedera Mainnet
  },

  // Vault Information
  vaultInfo: {
    name: "Vistia Real Vault",
    description: "Real vault connected to Hedera smart contract",
    token: "USDC",
    tokenDecimals: 6,
    apy: 15.0,
    riskLevel: "Medium",
    maxShareholders: 50, 
  },

  // Development Settings
  development: {
    enableRealContract: true, // Bật để sử dụng smart contract thực
    enableLogging: true,
    autoRefreshInterval: 30000, // 30 seconds
  }
};

// Helper function để lấy config
export const getHederaConfig = () => {
  return HEDERA_CONFIG;
};

// Helper function để update config
export const updateHederaConfig = (updates: Partial<typeof HEDERA_CONFIG>) => {
  Object.assign(HEDERA_CONFIG, updates);
};

// Contract function signatures
export const CONTRACT_FUNCTIONS = {
  // Vault functions
  getVaultState: "getVaultState()",
  shares: "shares(address)",
  totalShares: "totalShares()",
  getShareholderCount: "getShareholderCount()",
  getShareholders: "getShareholders()",
  isWhitelisted: "isWhitelisted(address)",
  calculateWithdrawalAmount: "calculateWithdrawalAmount(uint256)",
  deposit: "deposit(uint256)",
  withdraw: "withdraw()",
  enableWithdrawals: "enableWithdrawals()",
  
  // Token functions
  balanceOf: "balanceOf(address)",
  approve: "approve(address,uint256)",
  allowance: "allowance(address,address)",
  transfer: "transfer(address,uint256)",
  transferFrom: "transferFrom(address,address,uint256)"
}; 