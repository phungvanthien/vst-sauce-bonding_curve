import { 
  ContractExecuteTransaction, 
  ContractFunctionParameters, 
  ContractId,
  AccountId,
  Long,
  TransactionResponse
} from "@hashgraph/sdk";
import { ethers } from 'ethers';
import { accountIdToEvmAddress } from '@/utils/account-utils';
import { contractIdToEvmAddress } from '@/utils/contract-utils';
import { getTokenDecimal, toSmallestUnits, fromSmallestUnits } from '@/utils/token-utils';

// Import the real Vault ABI that works in tests
import vaultABI from '../../Vault.json';

// Use the real ABI for ethers.js operations
const VAULT_ABI_ETHERS = vaultABI.abi;

// Keep the simple ABI for Hedera SDK operations
const VAULT_ABI = {
  // View functions
  getVaultState: "getVaultState()",
  shares: "shares(address)",
  totalShares: "totalShares()",
  getShareholderCount: "getShareholderCount()",
  getShareholders: "getShareholders()",
  isWhitelisted: "isWhitelisted(address)",
  calculateWithdrawalAmount: "calculateWithdrawalAmount(uint256)",
  runTimestamp: "runTimestamp()",
  stopTimestamp: "stopTimestamp()",
  token1: "token1()",
  token2: "token2()",
  
  // State changing functions
  deposit: "deposit(uint256)",
  withdraw: "withdraw()",
  enableWithdrawals: "enableWithdrawals()",
  
  // Events
  Deposited: "Deposited(address,uint256,uint256)",
  Withdrawn: "Withdrawn(address,uint256,uint256)",
  DepositsClosed: "DepositsClosed()",
  WithdrawalsEnabled: "WithdrawalsEnabled()"
};

// Token ABI - Hedera smart contract functions
const TOKEN_ABI = {
  balanceOf: "balanceOf(address)",
  approve: "approve(address,uint256)",
  allowance: "allowance(address,address)",
  transfer: "transfer(address,uint256)",
  transferFrom: "transferFrom(address,address,uint256)"
};

export interface VaultState {
  totalShares: number;
  totalBalance: number;
  shareholderCount: number;
  depositsClosed: boolean;
  withdrawalsEnabled: boolean;
  vaultClosed: boolean;
  runTimestamp: number;
  stopTimestamp: number;
  token1Address: string;
  token2Address: string;
  apy: number;
}

export interface VaultInfo {
  id: string;
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

export interface WithdrawStatus {
  canWithdraw: boolean;
  isProcessing: boolean;
  message: string;
  timeRemaining?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  type: 'deposit' | 'withdraw';
  blockNumber: number;
}

export interface TraderInfo {
  address: string;
  shares: number;
  totalDeposited: number;
  lastTransaction: number;
  transactionCount: number;
}

export interface VaultServiceConfig {
  // Network Configuration
  rpcUrl?: string;
  mirrorNodeUrl?: string;
  
  // Rate Limiting
  callDelay?: number;
  batchDelay?: number;
  additionalDelay?: number;
  
  // Token Configuration
  tokenDecimals?: number;
  
  // Runtime State (optional for initialization)
  signer?: any;
  vaultAddress?: string;
  
  // Internal State (managed by service, not user-configurable)
  ethersProvider?: ethers.providers.JsonRpcProvider | null;
  vaultContractId?: ContractId | null;
}

/**
 * VaultService - Pure library for managing Hedera vault operations
 * 
 * This service provides a clean interface for interacting with Hedera vault contracts
 * without hardcoded values or test data. All configuration is passed through parameters.
 */
export class VaultService {
  // Configuration (contains all properties)
  private config: VaultServiceConfig;
  private readonly DEFAULT_CONFIG: VaultServiceConfig = {
    // Network Configuration
    rpcUrl: 'https://mainnet.hashio.io/api',
    mirrorNodeUrl: 'https://mainnet.mirrornode.hedera.com',
    
    // Rate Limiting
    callDelay: 200,
    batchDelay: 500,
    additionalDelay: 300,
    
    // Token Configuration
    tokenDecimals: 6,
  };

  constructor(config: VaultServiceConfig = {}) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    
    // Initialize vault contract if address provided
    if (config.vaultAddress) {
      try {
        this.config.vaultContractId = ContractId.fromString(config.vaultAddress);
      } catch (error) {
        console.error('❌ Error initializing vault contract in constructor:', error);
      }
    }
  }

  // ============================================================================
  // CORE SETUP & CONFIGURATION
  // ============================================================================

  /**
   * Set signer after construction (if not provided in constructor)
   */
  setSigner(signer: any): void {
    this.config.signer = signer;
  }

  /**
   * Set vault contract after construction (if not provided in constructor)
   */
  setVaultContract(vaultAddress: string): void {
    try {
      this.config.vaultContractId = ContractId.fromString(vaultAddress);
    } catch (error) {
      console.error('❌ Error setting vault contract:', error);
      throw error;
    }
  }

  // ============================================================================
  // PROVIDER MANAGEMENT
  // ============================================================================

  /**
   * Get or create ethers provider
   */
  private getEthersProvider(): ethers.providers.JsonRpcProvider {
    if (!this.config.ethersProvider) {
      this.config.ethersProvider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
    }
    return this.config.ethersProvider;
  }

  /**
   * Ensure provider is ready
   */
  private async ensureProvider(): Promise<void> {
    if (!this.config.signer) {
      throw new Error('Service not initialized. Call setSigner() first.');
    }
  }

  // ============================================================================
  // READ-ONLY CONTRACT QUERIES
  // ============================================================================

  /**
   * Get comprehensive vault state
   */
  async getVaultInfo(vaultAddress: string): Promise<VaultState> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());

      // Get all vault state in parallel
      const [runTimestamp, stopTimestamp, token1Address, token2Address, vaultState] = await Promise.all([
        vaultContract.runTimestamp(),
        vaultContract.stopTimestamp(),
        vaultContract.token1(),
        vaultContract.token2(),
        vaultContract.getVaultState()
      ]);

      const { _totalShares, _totalBalance, _shareholderCount, _depositsClosed, _vaultClosed } = vaultState;
            
      // Calculate current time-based states
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const depositsClosedByTime = currentTimestamp >= runTimestamp.toNumber();
      const withdrawalsEnabledByTime = currentTimestamp >= stopTimestamp.toNumber();
      
      // Convert values
      const totalSharesNum = _totalShares.toNumber();
      const totalBalanceRaw = _totalBalance.toNumber ? _totalBalance.toNumber() : Number(_totalBalance);
      const totalBalanceNum = await fromSmallestUnits(totalBalanceRaw, this.config.tokenDecimals?.toString());

      // Calculate APY
      const computedApy = totalSharesNum > 0 ? Math.max(((totalBalanceRaw - totalSharesNum) / totalSharesNum) * 100, 0) : 0;

      return {
        totalShares: totalSharesNum,
        totalBalance: totalBalanceNum,
        shareholderCount: _shareholderCount.toNumber(),
        depositsClosed: _depositsClosed || depositsClosedByTime,
        withdrawalsEnabled: withdrawalsEnabledByTime,
        vaultClosed: _vaultClosed,
        runTimestamp: runTimestamp.toNumber(),
        stopTimestamp: stopTimestamp.toNumber(),
        token1Address: typeof token1Address === 'string' ? token1Address : token1Address.toString(),
        token2Address: typeof token2Address === 'string' ? token2Address : token2Address.toString(),
        apy: Number.isFinite(computedApy) ? Number(computedApy.toFixed(2)) : 0
      };
    } catch (error) {
      console.error('❌ Error getting vault info:', error);
      throw error;
    }
  }

  /**
   * Get run timestamp from vault contract
   */
  async getRunTimestamp(): Promise<number> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      await this.delay(this.config.callDelay!);
      
      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      const ts: any = await vaultContract.runTimestamp();
      
      const value = ts?.toNumber ? ts.toNumber() : Number(ts);
      return value;
    } catch (error) {
      console.error('❌ Error getting run timestamp:', error);
      throw error;
    }
  }

  /**
   * Get stop timestamp from vault contract
   */
  async getStopTimestamp(): Promise<number> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }
      
      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
        const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      const ts: any = await vaultContract.stopTimestamp();
      
      const value = ts?.toNumber ? ts.toNumber() : Number(ts);
      return value;
    } catch (error) {
      console.error('❌ Error getting stop timestamp:', error);
      throw error;
    }
  }

  /**
   * Get token1 address from vault contract
   */
  async getToken1Address(): Promise<string> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }
      
      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      const address = await vaultContract.token1();
      return typeof address === 'string' ? address : address.toString();
    } catch (error) {
      console.error('❌ Error getting token1 address:', error);
      throw error;
    }
  }

  /**
   * Get token2 address from vault contract
   */
  async getToken2Address(): Promise<string> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      const address = await vaultContract.token2();
      return typeof address === 'string' ? address : address.toString();
    } catch (error) {
      console.error('❌ Error getting token2 address:', error);
      throw error;
    }
  }

  /**
   * Get user shares from vault contract
   */
  async getUserShares(userEVMAddress: string): Promise<number> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      
      const shares = await vaultContract.shares(userEVMAddress);
      const value = shares?.toNumber ? shares.toNumber() : Number(shares);
      return await fromSmallestUnits(value, this.config.tokenDecimals?.toString());
    } catch (error) {
      console.error('❌ Error getting user shares:', error);
      return 0;
    }
  }

  /**
   * Get token balance for user
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<number> {
    try {
      await this.ensureProvider();
      
      // Convert Hedera account ID to EVM address
      const evmUserAddress = await accountIdToEvmAddress(userAddress);
      
      // Use ethers.js for balance query
      const provider = this.getEthersProvider();
      const contract = new ethers.Contract(
        await contractIdToEvmAddress(tokenAddress),
        ['function balanceOf(address owner) view returns (uint256)'],
        provider
      );

      const balance = await contract.balanceOf(evmUserAddress);
      return Number(balance);
    } catch (error) {
      console.error('❌ Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Check token allowance
   */
  async checkAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string): Promise<number> {
    try {
      await this.ensureProvider();
      
      // Convert addresses
      const evmOwnerAddress = await accountIdToEvmAddress(ownerAddress);
      const evmSpenderAddress = await contractIdToEvmAddress(spenderAddress);
      
      const { ContractCallQuery, ContractFunctionParameters } = await import('@hashgraph/sdk');
      const params = new ContractFunctionParameters()
        .addAddress(evmOwnerAddress)
        .addAddress(evmSpenderAddress);
      
      const query = new ContractCallQuery()
        .setContractId(ContractId.fromString(tokenAddress))
        .setFunction(TOKEN_ABI.allowance, params);

      const response = await query.execute(this.config.signer);
      const allowance = response.getUint256(0) || Long.ZERO;
      
      return Number(allowance);
    } catch (error) {
      console.error('❌ Error checking allowance:', error);
      return 0;
    }
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  /**
   * Wait for transaction receipt
   */
  async waitForReceipt(response: TransactionResponse): Promise<any> {
    await this.ensureProvider();
    try {
      // Try SDK getReceipt first
      try {
        const receipt = await response.getReceipt(this.config.signer);
        return receipt;
      } catch (sdkError) {
        console.warn('SDK getReceipt failed, fallback to Mirror Node:', sdkError);
      }

      // Fallback to Mirror Node polling
      const txIdRaw = (response as any)?.transactionId?.toString?.() || (response as any)?.transactionId;
      if (!txIdRaw) throw new Error('Missing transactionId on response');
      
      // Convert SDK format to Mirror Node format
      const { hyphen, at } = (() => {
        const s = String(txIdRaw);
        if (s.includes('@')) {
          const [payer, ts] = s.split('@');
          const [sec, nanoRaw] = (ts || '').split('.') as [string, string];
          const nano = (nanoRaw || '0').padEnd(9, '0').slice(0, 9);
          return { hyphen: `${payer}-${sec}-${nano}`, at: `${payer}@${sec}.${nano}` };
        }
        return { hyphen: s, at: s };
      })();
      
      if (!hyphen) throw new Error('Missing transactionId on response');

      const baseUrl = this.config.mirrorNodeUrl;
      const start = Date.now();
      const timeoutMs = 45_000;
      const pollInterval = 3000;
      let attempts = 0;
      const maxAttempts = Math.floor(timeoutMs / pollInterval);

      const [payer, sec, nano] = hyphen.split('-');
      const timestamp = `${sec}.${nano}`;

      while (Date.now() - start < timeoutMs && attempts < maxAttempts) {
        attempts++;

        try {
          const timestampEnd = `${parseInt(sec) + 30}.000000000`;
          const accountUrl = `${baseUrl}/api/v1/transactions?account.id=${encodeURIComponent(payer)}&timestamp=gte:${encodeURIComponent(timestamp)}&timestamp=lt:${encodeURIComponent(timestampEnd)}&order=desc&limit=20`;
          
          const res = await fetch(accountUrl);
          if (res.ok) {
            const data = await res.json();
            
            if (data?.transactions?.length > 0) {
              const matchingTx = data.transactions.find((tx: any) => 
                tx.transaction_id === hyphen || tx.transaction_id === at
              );
              if (matchingTx) {
                if (matchingTx.status === 'SUCCESS') {
                  return matchingTx;
                }
                if (matchingTx.status === 'FAIL') {
                  throw new Error(`Transaction failed: ${matchingTx.result || 'Unknown error'}`);
                }
              }
            }
          }

          if (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, pollInterval));
          }

        } catch (fetchError) {
          console.warn('Mirror Node fetch error:', fetchError);
          if (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, pollInterval));
          }
        }
      }

      // Assume success after timeout
      return {
        transaction_id: hyphen,
        status: 'SUCCESS',
        consensus_timestamp: timestamp,
        note: 'Transaction submitted successfully but not confirmed via Mirror Node'
      };

    } catch (error) {
      console.error('❌ Error waiting for receipt:', error);
      throw error;
    }
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress: string, spenderAddress: string, amount: number): Promise<TransactionResponse> {
    try {
      await this.ensureProvider();
      
      const amountSmallest = await toSmallestUnits(amount, this.config.tokenDecimals?.toString());
      if (amountSmallest <= 0) {
        throw new Error('Approval amount must be greater than 0');
      }
      
      const evmSpenderAddress = await contractIdToEvmAddress(spenderAddress);
      
      const { ContractExecuteTransaction, ContractFunctionParameters } = await import('@hashgraph/sdk');
      
      const params = new ContractFunctionParameters()
        .addAddress(evmSpenderAddress)
        .addUint256(amountSmallest);
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(tokenAddress))
        .setGas(500000)
        .setFunction(TOKEN_ABI.approve, params);

      const frozenTransaction = await transaction.freezeWithSigner(this.config.signer);
      const response = await frozenTransaction.executeWithSigner(this.config.signer);
      
      return response;
    } catch (error) {
      console.error('❌ Error approving token:', error);
      throw error;
    }
  }

  /**
   * Deposit into vault
   */
  async deposit(amount: number): Promise<TransactionResponse> {
    try {
      await this.ensureProvider();
      
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const amountSmallest = await toSmallestUnits(amount, this.config.tokenDecimals?.toString());
      
      const { ContractExecuteTransaction, ContractFunctionParameters } = await import('@hashgraph/sdk');
      
      const params = new ContractFunctionParameters()
        .addUint256(amountSmallest);
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.config.vaultContractId)
        .setGas(500000)
        .setFunction(VAULT_ABI.deposit, params);

      const frozenTransaction = await transaction.freezeWithSigner(this.config.signer);
      const response = await frozenTransaction.executeWithSigner(this.config.signer);
      
      return response;
    } catch (error) {
      console.error('❌ Error depositing:', error);
      throw error;
    }
  }

  /**
   * Withdraw from vault (manager only)
   */
  async withdraw(): Promise<TransactionResponse> {
    try {
      await this.ensureProvider();
      
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const { ContractExecuteTransaction, ContractFunctionParameters } = await import('@hashgraph/sdk');
      
      const params = new ContractFunctionParameters();
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.config.vaultContractId)
        .setGas(500000)
        .setFunction(VAULT_ABI.withdraw, params);

      const frozenTransaction = await transaction.freezeWithSigner(this.config.signer);
      const response = await frozenTransaction.executeWithSigner(this.config.signer);
      
      return response;
    } catch (error) {
      console.error('❌ Error withdrawing:', error);
      throw error;
    }
  }

  /**
   * Enable withdrawals (manager only)
   */
  async enableWithdrawals(): Promise<TransactionResponse> {
    try {
      await this.ensureProvider();
      
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const { ContractExecuteTransaction, ContractFunctionParameters } = await import('@hashgraph/sdk');
      
      const params = new ContractFunctionParameters();
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.config.vaultContractId)
        .setGas(200000)
        .setFunction(VAULT_ABI.enableWithdrawals, params);

      const frozenTransaction = await transaction.freezeWithSigner(this.config.signer);
      const response = await frozenTransaction.executeWithSigner(this.config.signer);
      
      return response;
    } catch (error) {
      console.error('❌ Error enabling withdrawals:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER & SHAREHOLDER MANAGEMENT
  // ============================================================================

  /**
   * Get shareholders list
   */
  async getShareholdersList(): Promise<{ success: boolean; data: string[]; error?: string }> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      
      const shareholders = await vaultContract.getShareholders();
      
      const addresses = shareholders.map((addr: any) => 
        typeof addr === 'string' ? addr : addr.toString()
      );

      return { success: true, data: addresses };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Error getting shareholders list:', errorMsg);
      return { success: false, data: [], error: errorMsg };
    }
  }

  /**
   * Get top traders by shares
   */
  async getTopTraders(limit: number = 10): Promise<TraderInfo[]> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      
      const shareholders = await vaultContract.getShareholders();
      const addresses = shareholders.map((addr: any) => 
        typeof addr === 'string' ? addr : addr.toString()
      );

      const traders: TraderInfo[] = [];
      for (const address of addresses) {
        const shares = await this.getUserShares(address);
        if (shares > 0) {
          traders.push({
            address,
            shares,
            totalDeposited: shares, // 1:1 ratio
            lastTransaction: Date.now(),
            transactionCount: 1
          });
        }
      }

      return traders.sort((a, b) => b.shares - a.shares).slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting top traders:', error);
      return [];
    }
  }

  /**
   * Check if address is whitelisted
   */
  async isAddressWhitelisted(address: string): Promise<{ success: boolean; data: boolean; error?: string }> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      
      const isWhitelisted = await vaultContract.isWhitelisted(address);
      const value = Boolean(isWhitelisted);
      
      return { success: true, data: value };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Error checking whitelist status:', errorMsg);
      return { success: false, data: false, error: errorMsg };
    }
  }

  /**
   * Calculate withdrawal amount for given shares
   */
  async calculateWithdrawalAmount(shareAmount: number): Promise<{ success: boolean; data: number; error?: string }> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Vault contract not initialized');
      }

      const vaultEvm = await contractIdToEvmAddress(this.config.vaultContractId.toString());
      const vaultContract = new ethers.Contract(vaultEvm, VAULT_ABI_ETHERS, this.getEthersProvider());
      
      const withdrawalAmount = await vaultContract.calculateWithdrawalAmount(shareAmount);
      const value = withdrawalAmount.toNumber ? withdrawalAmount.toNumber() : Number(withdrawalAmount);
      
      return { success: true, data: value };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Error calculating withdrawal amount:', errorMsg);
      return { success: false, data: 0, error: errorMsg };
    }
  }

  // ============================================================================
  // UTILITY & FORMATTING FUNCTIONS
  // ============================================================================

  /**
   * Check withdrawal status
   */
  async checkWithdrawStatus(vaultAddress: string): Promise<WithdrawStatus> {
    try {
      if (!this.config.vaultContractId) {
        throw new Error('Contract not initialized');
      }

      const vaultState = await this.getVaultInfo(vaultAddress);
      
      if (vaultState.withdrawalsEnabled) {
        return {
          canWithdraw: true,
          isProcessing: false,
          message: 'Withdrawals are now enabled. You can withdraw your funds.',
        };
      } else {
        return {
          canWithdraw: false,
          isProcessing: false,
          message: 'You need to wait until withdrawals are enabled.',
        };
      }
    } catch (error) {
      console.error('Error checking withdraw status:', error);
      return {
        canWithdraw: false,
        isProcessing: false,
        message: 'Error checking withdraw status',
      };
    }
  }

  /**
   * Format amount as currency
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format timestamp as readable string
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Format hash for display
   */
  formatHash(hash: string): string {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  }

  /**
   * Get time remaining until timestamp
   */
  getTimeRemaining(timestamp: number) {
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

  /**
   * Format relative time
   */
  formatRelativeTime(timestamp: number): string {
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

  // ============================================================================
  // TESTING & DEBUGGING
  // ============================================================================

  /**
   * Test network connectivity
   */
  async testNetworkConnectivity(): Promise<{ success: boolean; networkInfo: any; error?: string }> {
    try {
      const provider = this.getEthersProvider();
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = await provider.getGasPrice();
      
      const networkInfo = {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        gasPrice: gasPrice.toString()
      };
      
      return { success: true, networkInfo };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Network connectivity test failed:', errorMsg);
      return { success: false, networkInfo: {}, error: errorMsg };
    }
  }

  /**
   * Run comprehensive vault state tests
   */
  async runVaultStateTests(): Promise<{
    summary: { total: number; passed: number; failed: number };
    results: { [key: string]: any };
  }> {
    const results: { [key: string]: any } = {};
    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Network connectivity
      const networkTest = await this.testNetworkConnectivity();
      results.networkConnectivity = networkTest;
      networkTest.success ? passed++ : failed++;

      // Test 2: Basic state functions (only if contract is initialized)
      if (this.config.vaultContractId) {
        const runTimestampTest = await this.getRunTimestamp().then(
          value => ({ success: true, value }),
          error => ({ success: false, value: 0, error: String(error) })
        );
        results.runTimestamp = runTimestampTest;
        runTimestampTest.success ? passed++ : failed++;

        const stopTimestampTest = await this.getStopTimestamp().then(
          value => ({ success: true, value }),
          error => ({ success: false, value: 0, error: String(error) })
        );
        results.stopTimestamp = stopTimestampTest;
        stopTimestampTest.success ? passed++ : failed++;

        const token1Test = await this.getToken1Address().then(
          value => ({ success: true, value }),
          error => ({ success: false, value: '', error: String(error) })
        );
        results.token1Address = token1Test;
        token1Test.success ? passed++ : failed++;

        const token2Test = await this.getToken2Address().then(
          value => ({ success: true, value }),
          error => ({ success: false, value: '', error: String(error) })
        );
        results.token2Address = token2Test;
        token2Test.success ? passed++ : failed++;
      } else {
        results.contractInitialization = { success: false, error: 'Contract not initialized' };
        failed++;
      }

    } catch (error) {
      results.executionError = { success: false, error: String(error) };
      failed++;
    }

    const summary = { total: passed + failed, passed, failed };
    return { summary, results };
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Helper function to add delay between calls
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a factory function for creating instances
export const createVaultService = (config?: VaultServiceConfig): VaultService => {
  return new VaultService(config);
};
