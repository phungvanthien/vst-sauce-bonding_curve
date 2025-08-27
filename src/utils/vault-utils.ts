import { VaultState, TraderInfo, Transaction, WithdrawStatus } from '@/services/vaultService';
import { HEDERA_CONFIG } from '@/config/hederaConfig';

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

// Initialize vaults - now only creates real vaults
export function initializeVaults(): Vault[] {
  return [];
}

// Create vault configuration
export function createRealVault(): Vault {
  return {
    id: 1,
    name: HEDERA_CONFIG.vaultInfo.name,
    description: HEDERA_CONFIG.vaultInfo.description,
    token: HEDERA_CONFIG.vaultInfo.token,
    tokenAddress: HEDERA_CONFIG.contracts.tokenContractId,
    vaultAddress: HEDERA_CONFIG.contracts.vaultContractId,
    totalDeposits: 0,
    totalShares: 0,
    shareholderCount: 0,
    maxShareholders: HEDERA_CONFIG.vaultInfo.maxShareholders,
    runTimestamp: 1754368292-3600*90, // 1 year from now
    stopTimestamp: 1754368292-3600*30, // 2 years from now
    depositsClosed: false,
    withdrawalsEnabled: false,
    apy: HEDERA_CONFIG.vaultInfo.apy,
    riskLevel: HEDERA_CONFIG.vaultInfo.riskLevel,
    status: "active",
  };
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

export function updateVaultAfterWithdraw(vault: Vault, withdrawalAmount: number, sharesWithdrawn: number, isLastShareholder: boolean): Vault {
  return {
    ...vault,
    totalDeposits: vault.totalDeposits - withdrawalAmount,
    totalShares: vault.totalShares - sharesWithdrawn,
    shareholderCount: vault.shareholderCount - (isLastShareholder ? 1 : 0)
  };
}
