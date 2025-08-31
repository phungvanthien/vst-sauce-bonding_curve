import { TraderInfo, Transaction, WithdrawStatus, VaultState } from '@/services/vaultService';
import { VAULTS_CONFIG } from '@/config/hederaConfig';
import { getTokenSymbolFromAddress } from '@/config/tokenAddress';

export interface Vault {
  id: number;
  name: string;
  description: string;
  token: string;
  tokenAddress: string;
  vaultAddress: string;
  totalDeposits: number;
  totalShares: number;
  shareholderCount: number;
  maxShareholders: number;
  runTimestamp: number;
  stopTimestamp: number;
  depositsClosed: boolean;
  withdrawalsEnabled: boolean;
  apy: number;
  riskLevel: string;
  status: string;
}

// Initialize vaults - now creates multiple real vaults
export function initializeVaults(): Vault[] {
  return [];
}

// Create vault configuration for a single vault
export function createVault(vaultConfig: any, vaultInfo: VaultState): Vault {
  // Get token symbol from token1Address in vault info
  const tokenSymbol = getTokenSymbolFromAddress(vaultInfo.token1Address);
  
  return {
    id: vaultConfig.id,
    name: vaultConfig.name,
    description: vaultConfig.description,
    token: tokenSymbol, // Use dynamic token symbol from vault info
    tokenAddress: vaultInfo.token1Address, // Use token1Address from vault info
    vaultAddress: vaultConfig.vaultAddress,
    totalDeposits: vaultInfo.totalBalance,
    totalShares: vaultInfo.totalShares,
    shareholderCount: vaultInfo.shareholderCount,
    maxShareholders: vaultConfig.maxShareholders,
    runTimestamp: vaultInfo.runTimestamp,
    stopTimestamp: vaultInfo.stopTimestamp,
    depositsClosed: vaultInfo.depositsClosed,
    withdrawalsEnabled: vaultInfo.withdrawalsEnabled,
    apy: vaultInfo.apy,
    riskLevel: vaultConfig.riskLevel,
    status: "active",
  };
}

// Create multiple vaults from config
export function createMultipleVaults(vaultInfos: Record<string, VaultState>): Vault[] {
  const vaults: Vault[] = [];
  
  for (const vaultConfig of VAULTS_CONFIG.vaults) {
    // Skip vaults without addresses
    if (!vaultConfig.vaultAddress) {
      continue;
    }
    
    const vaultInfo = vaultInfos[vaultConfig.vaultAddress];
    if (vaultInfo) {
      const vault = createVault(vaultConfig, vaultInfo);
      vaults.push(vault);
    }
  }
  
  return vaults;
}

// Generate trader data - now returns empty array since we only use real data
export function generateTraders(vaultAddress: string): TraderInfo[] {
  return [];
}

// Generate transaction history - now returns empty array since we only use real data
export function generateTransactions(vaultAddress: string): Transaction[] {
  return [];
}

// Generate withdraw status - now returns default status since we only use real data
export function generateWithdrawStatus(vault: Vault): WithdrawStatus {
  return {
    canWithdraw: false,
    isProcessing: false,
    message: 'Withdrawals are not yet enabled for this vault',
    timeRemaining: undefined
  };
}

// Validate vault for operations
export function validateVaultForDeposit(vault: Vault): void {
  if (vault.depositsClosed) {
    throw new Error('Deposits are closed for this vault');
  }

  if (vault.shareholderCount >= vault.maxShareholders) {
    throw new Error('Vault has reached maximum shareholders');
  }
}

export function validateVaultForWithdraw(vault: Vault): void {
  if (!vault.withdrawalsEnabled) {
    throw new Error('Withdrawals are not yet enabled for this vault');
  }
}

// Format vault data for display
export function formatVaultAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatHash(hash: string): string {
  if (!hash) return '';
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}

export function getTimeRemaining(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const remaining = timestamp - now;
  
  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, status: 'expired' };
  }
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  return { days, hours, minutes, status: 'active' };
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Calculate shares for vaults
export function calculateShares(amount: number, vault: Vault): number {
  return Math.floor(amount * (vault.totalShares / vault.totalDeposits));
}

// Update vault data after operations
export function updateVaultAfterDeposit(vault: Vault, amount: number, newShares: number, isNewShareholder: boolean): Vault {
  return {
    ...vault,
    totalDeposits: vault.totalDeposits + amount,
    totalShares: vault.totalShares + newShares,
    shareholderCount: vault.shareholderCount + (isNewShareholder ? 1 : 0)
  };
}
