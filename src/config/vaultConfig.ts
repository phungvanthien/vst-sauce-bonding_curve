// Vault Configuration
export const VAULT_CONFIG = {
  // Network Configuration
  network: {
    name: 'Hedera Testnet', // hoặc 'Hedera Mainnet'
    chainId: 296, // Testnet: 296, Mainnet: 295
    rpcUrl: 'https://mainnet.hashio.io/api', // hoặc mainnet URL
  },

  // Smart Contract Addresses
  contracts: {
    // Thay thế bằng địa chỉ thực của bạn
    vaultAddress: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1', // Vault contract address
    tokenAddress: '0x000000000000000000000000000000000006f89a', // Token contract address (HBAR)
  },

  // Vault Information
  vaultInfo: {
    name: "Vistia Growth Vault",
    description: "High-yield vault for long-term growth strategies",
    token: "HBAR",
    apy: 12.5,
    riskLevel: "Medium",
    maxShareholders: 100,
  },

  // Development Settings
  development: {
    useMockData: false, // Set to false to use only real smart contracts
    enableLogging: true,
    autoRefreshInterval: 30000, // 30 seconds
  }
};

// Helper function để lấy config
export const getVaultConfig = () => {
  return VAULT_CONFIG;
};

// Helper function để update config
export const updateVaultConfig = (updates: Partial<typeof VAULT_CONFIG>) => {
  Object.assign(VAULT_CONFIG, updates);
}; 