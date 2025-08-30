// Vaults Configuration
export const VAULTS_CONFIG = {
  vaults: [
    {
      id: 1,
      name: "Vistia Growth Vault",
      description: "High-growth investment strategy with moderate risk",
      token: "USDC", // Default token symbol (will be overridden by vault info)
      tokenAddress: "", // Will be dynamically set from vault info
      vaultAddress: "0xEA316d96F85e662aa7e213A900A87dbDDfCbE99a",
      apy: 15.0,
      riskLevel: "Medium",
      maxShareholders: 50,
    },
    {
      id: 2,
      name: "Vistia Conservative Vault", 
      description: "Low-risk stable investment strategy",
      token: "USDC", // Default token symbol (will be overridden by vault info)
      tokenAddress: "", // Will be dynamically set from vault info
      vaultAddress: "",
      apy: 8.5,
      riskLevel: "Low",
      maxShareholders: 100,
    },
    {
      id: 3,
      name: "Vistia Aggressive Vault",
      description: "High-risk, high-reward investment strategy",
      token: "USDC", // Default token symbol (will be overridden by vault info)
      tokenAddress: "", // Will be dynamically set from vault info
      vaultAddress: "",
      apy: 22.0,
      riskLevel: "High",
      maxShareholders: 30,
    },
    {
      id: 4,
      name: "Vistia Balanced Vault",
      description: "Balanced risk-reward investment strategy",
      token: "USDC", // Default token symbol (will be overridden by vault info)
      tokenAddress: "", // Will be dynamically set from vault info
      vaultAddress: "",
      apy: 12.5,
      riskLevel: "Medium",
      maxShareholders: 75,
    },
  ]
};

// Helper function to get config
export const getVaultsConfig = () => {
  return VAULTS_CONFIG;
};

// Helper function to update config
export const updateVaultsConfig = (updates: Partial<typeof VAULTS_CONFIG>) => {
  Object.assign(VAULTS_CONFIG, updates);
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