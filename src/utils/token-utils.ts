import type { Id, Address } from '@/types/types'
import { TokenId } from '@hashgraph/sdk'
import { ethers } from 'ethers'
import { 
  AccountAllowanceApproveTransaction,
  ContractId,
  Long
} from '@hashgraph/sdk'
import { evmAliasAddressToContractId } from './contract-utils'

// Cache interface
interface TokenDecimalCache {
  [tokenAddressOrId: string]: number
}

// In-memory cache for faster access
let memoryCache: TokenDecimalCache | null = null

// LocalStorage key for token decimal cache
const CACHE_STORAGE_KEY = 'token-decimal-cache'

// Helper: Check if is native
function isNative(tokenAddressOrId: Address | Id) {
    return tokenAddressOrId === '0x0000000000000000000000000000000000000000' || tokenAddressOrId === '0.0.0'
}

/**
 * Load cache from localStorage
 */
function loadCache(): TokenDecimalCache {
    if (memoryCache) {
        return memoryCache
    }

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const cached = window.localStorage.getItem(CACHE_STORAGE_KEY)
            if (cached) {
                memoryCache = JSON.parse(cached)
                return memoryCache || {}
            }
        }
    } catch (error) {
        console.log('[token-utils] localStorage cache not found or invalid, will create new one:', error)
    }

    // Initialize empty cache
    memoryCache = {}
    return memoryCache
}

/**
 * Save cache to localStorage
 */
function saveCache(cache: TokenDecimalCache): void {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache))
        }
    } catch (error) {
        console.warn('[token-utils] Failed to save cache to localStorage:', error)
    }
}

/**
 * Get cached decimal value
 */
function getCachedDecimal(tokenAddressOrId: string): number | null {
    const cache = loadCache()
    return cache[tokenAddressOrId] || null
}

/**
 * Set cached decimal value
 */
function setCachedDecimal(tokenAddressOrId: string, decimal: number): void {
    const cache = loadCache()
    cache[tokenAddressOrId] = decimal
    memoryCache = cache
    saveCache(cache)
}

export async function getTokenDecimal(tokenAddressOrId: Address | Id) {
    if (!import.meta.env.VITE_MIRROR_NODE_URL) {
        throw new Error('VITE_MIRROR_NODE_URL is not set')
    }

    if (isNative(tokenAddressOrId)) {
        return 8
    }

    const tokenAddressOrIdString = tokenAddressOrId as string
    
    // Check cache first
    const cachedDecimal = getCachedDecimal(tokenAddressOrIdString)
    if (cachedDecimal !== null) {
        return cachedDecimal
    }
    
    let tokenIdString: string
    if (tokenAddressOrIdString.startsWith('0x')) {
        const tokenId = TokenId.fromEvmAddress(0, 0, tokenAddressOrIdString as Address)
        tokenIdString = tokenId.toString()
    } else {
        tokenIdString = tokenAddressOrIdString as Id
    }
    
    try {
        const res = await fetch(`${import.meta.env.VITE_MIRROR_NODE_URL}/tokens/${tokenIdString}`)
        if (!res.ok) {
            throw new Error(`Failed to fetch token data: ${res.status}`)
        }
        
        const data = await res.json()
        let decimal = data.decimals
        
        if (typeof decimal !== 'number') {
            decimal = Number(data.decimals)
        }
        
        // Cache the result
        setCachedDecimal(tokenAddressOrIdString, decimal)
        
        // Also cache the token ID version if it's different
        if (tokenIdString !== tokenAddressOrIdString) {
            setCachedDecimal(tokenIdString, decimal)
        }
        return decimal
    } catch (error) {
        console.error('[token-utils] Error fetching token decimal:', error)
        throw error
    }
}

// Convert human units to smallest units using token decimals
export async function toSmallestUnits(amountUnits: number, tokenType?: string): Promise<number> {
    const decimals = await getTokenDecimal(tokenType as Address | Id);
    const factor = Math.pow(10, decimals);
    return amountUnits * factor;
}

// Convert smallest units to human units using token decimals
export async function toHumanReadable(amountSmallest: number, tokenType?: string): Promise<number> {
    const decimals = await getTokenDecimal(tokenType as Address | Id);
    const factor = Math.pow(10, decimals);
    return amountSmallest / factor;
}

// Format token amount for display
export function formatTokenAmount(amount: number, tokenType: string = 'USDC'): string {
    if (tokenType === 'HBAR') {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        }).format(amount);
    }
    
    // For USD tokens
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Validate token amount
export function validateTokenAmount(amount: number, userBalance: number, tokenType: string): void {
    if (amount <= 0) {
        throw new Error(`Amount must be greater than 0`);
    }
    
    if (amount > userBalance) {
        throw new Error(`Insufficient ${tokenType} balance. You have ${userBalance} ${tokenType} but need ${amount} ${tokenType}`);
    }
}

/**
 * Clear the token decimal cache
 */
export function clearTokenDecimalCache(): void {
    memoryCache = null
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(CACHE_STORAGE_KEY)
        }
    } catch (error) {
        console.warn('[token-utils] Failed to clear cache:', error)
    }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; keys: string[] } {
    const cache = loadCache()
    return {
        entries: Object.keys(cache).length,
        keys: Object.keys(cache)
    }
}

// ============================================================================
// TOKEN ID UTILS
// ============================================================================

/**
 * Convert token ID to EVM address
 * @param tokenId - The token ID
 * @returns The EVM address
 */
export function tokenIdToEvmAddress(tokenId: string) {
    const id = TokenId.fromString(tokenId);
    const evmAddress = id.toEvmAddress();
    return evmAddress;
}

/**
 * Convert EVM address to token ID
 * @param evmAddress - The token's EVM address
 * @returns The token ID
 */
export function evmAddressToTokenId(evmAddress: string) {
    const id = TokenId.fromEvmAddress(0, 0, evmAddress);
    return id.toString();
}

/**
 * Check if token is HBAR
 * @param tokenType - The token type
 * @returns True if token is HBAR, false otherwise
 */
export function isHBARToken(tokenType: string): boolean {
    return tokenType === 'HBAR';
}

// ============================================================================
// TOKEN APPROVAL FUNCTIONS
// ============================================================================

/**
 * Interface for token approval response
 */
export interface TokenApprovalResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  data?: any;
}

/**
 * Interface for token allowance check response
 */
export interface TokenAllowanceResponse {
  allowance: bigint;
  isSufficient: boolean;
  requiredAmount: bigint;
}

/**
 * Get RPC provider for Hedera network
 */
function getHederaProvider(): ethers.providers.JsonRpcProvider {
  const rpcUrl = import.meta.env.VITE_HEDERA_RPC_URL || 'https://mainnet.hashio.io/api';
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

/**
 * Get signer from HashConnect manager and pairing data
 */
function getSigner(manager: any, pairingData: any): any {
  return manager.getSigner(pairingData.accountIds[0]);
}

/**
 * Get EVM provider from window.ethereum
 */
function getEVMProvider(): ethers.providers.Web3Provider {
  if (!(window as any).ethereum) {
    throw new Error('No EVM wallet detected. Please install MetaMask or another EVM wallet.');
  }
  return new ethers.providers.Web3Provider((window as any).ethereum);
}

/**
 * Get EVM signer from window.ethereum
 */
function getEVMSigner(): any {
  const provider = getEVMProvider();
  return provider.getSigner();
}

/**
 * Get native token balance for EVM wallet
 * @param userAddress - The user's EVM address
 * @returns Promise<number> - Native token balance
 */
export async function getEVMNativeBalance(userAddress: string): Promise<number> {
  try {
    const provider = getEVMProvider();
    const balance = await provider.getBalance(userAddress);
    // Convert from wei to HBAR (assuming 18 decimals for native token)
    return parseFloat(ethers.utils.formatEther(balance));
  } catch (error) {
    console.error('[token-utils] Error getting EVM native balance:', error);
    return 0;
  }
}

/**
 * Wait for native token balance to be available with retry logic
 * @param userAddress - The user's EVM address
 * @param maxRetries - Maximum number of retries (default: 20)
 * @param retryDelay - Delay between retries in milliseconds (default: 5000)
 * @returns Promise<boolean> - True if balance is available, false if max retries reached
 */
export async function waitForEVMNativeBalance(
  userAddress: string,
  maxRetries: number = 20,
  retryDelay: number = 5000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const balance = await getEVMNativeBalance(userAddress);
      
      if (balance > 0) {
        console.log(`[token-utils] Native balance available: ${balance} HBAR (attempt ${attempt})`);
        return true;
      }
      
      console.log(`[token-utils] Native balance still 0, retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`);
      
      // Wait before next retry (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.error(`[token-utils] Error checking balance on attempt ${attempt}:`, error);
      
      // Wait before next retry (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.log(`[token-utils] Max retries (${maxRetries}) reached, native balance still not available`);
  return false;
}

/**
 * Check token allowance for a specific spender
 * @param tokenAddress - The token contract address
 * @param ownerAddress - The owner's address (who owns the tokens)
 * @param spenderAddress - The spender's address (who wants to spend the tokens)
 * @returns Promise<TokenAllowanceResponse> - Current allowance and sufficiency status
 */
export async function checkTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  requiredAmount?: bigint
): Promise<TokenAllowanceResponse> {
  try {
    const provider = getHederaProvider();
    
    // ERC20 allowance function ABI
    const abi = [
      'function allowance(address owner, address spender) external view returns (uint256)'
    ];
    
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    
    const allowanceBigInt = BigInt(allowance.toString());
    const requiredAmountBigInt = requiredAmount || BigInt(0);
    const isSufficient = allowanceBigInt >= requiredAmountBigInt;

    return {
      allowance: allowanceBigInt,
      isSufficient,
      requiredAmount: requiredAmountBigInt
    };
  } catch (error) {
    console.error('[token-utils] Error checking token allowance:', error);
    throw new Error(`Failed to check token allowance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Approve tokens for a spender using HashPack wallet
 * @param manager - HashConnect manager instance
 * @param pairingData - HashConnect pairing data
 * @param tokenAddress - The token contract address
 * @param spenderAddress - The spender's address to approve
 * @param amount - Amount to approve (can be string or bigint)
 * @param decimals - Token decimals (optional, will be fetched if not provided)
 * @returns Promise<TokenApprovalResponse> - Approval transaction result
 */
export async function approveTokensHashPack(
  manager: any,
  pairingData: any,
  tokenAddress: string,
  spenderAddress: string,
  amount: string | bigint,
  decimals?: number
): Promise<TokenApprovalResponse> {
  try {
    // Get token decimals if not provided
    let tokenDecimals = decimals;
    if (tokenDecimals === undefined) {
      tokenDecimals = await getTokenDecimal(tokenAddress as `0x${string}`);
    }

    // Convert amount to smallest units if it's a string
    let amountWei: bigint;
    if (typeof amount === 'string') {
      const amountNum = parseFloat(amount);
      const amountSmallest = Math.round(amountNum * Math.pow(10, tokenDecimals));
      amountWei = BigInt(amountSmallest);
    } else {
      amountWei = amount;
    }

    // Get signer
    const signer = getSigner(manager, pairingData);

    // Get ids
    const tokenId = evmAddressToTokenId(tokenAddress);
    const ownerId = pairingData.accountIds[0];
    const spenderId = await evmAliasAddressToContractId(spenderAddress);

    // Create approval transaction
    const transaction = new AccountAllowanceApproveTransaction()
      .approveTokenAllowance(tokenId, ownerId, spenderId, Long.fromString(amountWei.toString()));

    // Freeze and execute
    await transaction.freezeWithSigner(signer);
    const result = await manager.sendTransaction(pairingData.accountIds[0], transaction);

    return {
      success: true,
      transactionHash: result.transactionId?.toString(),
      data: result
    };
  } catch (error) {
    console.error('[token-utils] Error approving tokens with HashPack:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Approve tokens for a spender using EVM wallet
 * @param tokenAddress - The token contract address
 * @param spenderAddress - The spender's address to approve
 * @param amount - Amount to approve (can be string or bigint)
 * @param decimals - Token decimals (optional, will be fetched if not provided)
 * @returns Promise<TokenApprovalResponse> - Approval transaction result
 */
export async function approveTokensEVM(
  tokenAddress: string,
  spenderAddress: string,
  amount: string | bigint,
  decimals?: number
): Promise<TokenApprovalResponse> {
  try {
    // Get token decimals if not provided
    let tokenDecimals = decimals;
    if (tokenDecimals === undefined) {
      tokenDecimals = await getTokenDecimal(tokenAddress as `0x${string}`);
    }

    // Convert amount to smallest units if it's a string
    let amountWei: bigint;
    if (typeof amount === 'string') {
      const amountNum = parseFloat(amount);
      const amountSmallest = Math.round(amountNum * Math.pow(10, tokenDecimals));
      amountWei = BigInt(amountSmallest);
    } else {
      amountWei = amount;
    }

    // Get EVM signer
    const signer = getEVMSigner();

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      signer
    );

    // Execute approval transaction
    const tx = await tokenContract.approve(spenderAddress, amountWei);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: tx.hash,
      data: receipt
    };
  } catch (error) {
    console.error('[token-utils] Error approving tokens with EVM wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Approve tokens for a spender (supports both HashPack and EVM wallets)
 * @param manager - HashConnect manager instance (optional for EVM wallets)
 * @param pairingData - HashConnect pairing data (optional for EVM wallets)
 * @param tokenAddress - The token contract address
 * @param spenderAddress - The spender's address to approve
 * @param amount - Amount to approve (can be string or bigint)
 * @param decimals - Token decimals (optional, will be fetched if not provided)
 * @param walletType - Wallet type ('hashpack' or 'evm')
 * @returns Promise<TokenApprovalResponse> - Approval transaction result
 */
export async function approveTokens(
  manager: any,
  pairingData: any,
  tokenAddress: string,
  spenderAddress: string,
  amount: string | bigint,
  decimals?: number,
  walletType: 'hashpack' | 'evm' = 'hashpack'
): Promise<TokenApprovalResponse> {
  if (walletType === 'evm') {
    return await approveTokensEVM(tokenAddress, spenderAddress, amount, decimals);
  } else {
    return await approveTokensHashPack(manager, pairingData, tokenAddress, spenderAddress, amount, decimals);
  }
}

/**
 * Check if approval is needed and approve if necessary (supports both HashPack and EVM wallets)
 * @param manager - HashConnect manager instance (optional for EVM wallets)
 * @param pairingData - HashConnect pairing data (optional for EVM wallets)
 * @param tokenAddress - The token contract address
 * @param ownerAddress - The owner's address
 * @param spenderAddress - The spender's address
 * @param requiredAmount - Amount that needs to be approved
 * @param decimals - Token decimals (optional)
 * @param walletType - Wallet type ('hashpack' or 'evm')
 * @returns Promise<TokenApprovalResponse> - Result of the approval process
 */
export async function checkAndApproveTokens(
  manager: any,
  pairingData: any,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  requiredAmount: string | bigint,
  decimals?: number,
  walletType: 'hashpack' | 'evm' = 'hashpack'
): Promise<TokenApprovalResponse> {
  try {
    // Convert required amount to bigint for comparison
    let requiredAmountBigInt: bigint;
    if (typeof requiredAmount === 'string') {
      const tokenDecimals = decimals || await getTokenDecimal(tokenAddress as `0x${string}`);
      const amountNum = parseFloat(requiredAmount);
      const amountSmallest = Math.round(amountNum * Math.pow(10, tokenDecimals));
      requiredAmountBigInt = BigInt(amountSmallest);
    } else {
      requiredAmountBigInt = requiredAmount;
    }

    // Check current allowance
    const allowanceResult = await checkTokenAllowance(
      tokenAddress,
      ownerAddress,
      spenderAddress,
      requiredAmountBigInt
    );

    // If allowance is sufficient, no approval needed
    if (allowanceResult.isSufficient) {
      return {
        success: true,
        data: { message: 'Sufficient allowance already exists' }
      };
    }

    // Approve the required amount using the appropriate wallet type
    const approvalResult = await approveTokens(
      manager,
      pairingData,
      tokenAddress,
      spenderAddress,
      requiredAmount,
      decimals,
      walletType
    );

    return approvalResult;
  } catch (error) {
    console.error('[token-utils] Error in check and approve process:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Wait for transaction to be confirmed on the network
 * @param transactionHash - Transaction hash to wait for
 * @param timeoutMs - Timeout in milliseconds (default: 30 seconds)
 * @returns Promise<void> - Resolves when transaction is confirmed
 */
export async function waitForTransactionConfirmation(
  transactionHash: string,
  timeoutMs: number = 30000
): Promise<void> {
  const startTime = Date.now();
  const mirrorNodeUrl = import.meta.env.VITE_MIRROR_NODE_URL;
  
  if (!mirrorNodeUrl) {
    throw new Error('VITE_MIRROR_NODE_URL is not set');
  }

  // Replace % with hyphens and only the last dot with hyphen
  const formattedTransactionHash = transactionHash.replace(/@/, '-').replace(/\.([^.]*)$/, '-$1');
  
  console.log('[token-utils] Transaction hash transformation:', {
    original: transactionHash,
    transformed: formattedTransactionHash
  });

  while (Date.now() - startTime < timeoutMs) {
    try {
      const url = `${mirrorNodeUrl}/transactions/${encodeURIComponent(formattedTransactionHash)}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const entries = data?.transactions ?? [];
        const status = entries[0]?.result;
        
        if (status === 'SUCCESS') {
          return;
        }
        
        if (status && status !== 'PENDING' && status !== 'STATUS_UNKNOWN') {
          throw new Error(`Transaction failed with status: ${status}`);
        }
      }
    } catch (error) {
      console.warn('[token-utils] Error checking transaction status:', error);
    }
    
    // Wait 1.5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  throw new Error('Timeout waiting for transaction confirmation');
}
