'use client'

import { parseUnits, type Address } from "viem";
import { 
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Long,
  Hbar,
  TokenAssociateTransaction,
  TokenId,
  AccountId
} from "@hashgraph/sdk";
import { providers, Contract, utils } from 'ethers';
import { tokenAddress } from "@/config/tokenAddress";

// Response structure for all signing functions
export interface SignResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  data?: any;
}

// Calculate deadline (10 minutes from now)
function calculateDeadline(): number {
  return Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes in unix seconds
}

// Helper: get signer from manager
function getSigner(manager: any, pairingData: any) {
  return manager.getSigner(pairingData.accountIds[0]);
}

// Helper: get wHBAR address
function getWHBARAddress(): Address {
  return tokenAddress.whbar as `0x${string}`;
}

// Helper: Convert EVM contract address to Hedera contract ID
function toContractId(evmAddress: string): ContractId {
  return ContractId.fromEvmAddress(0, 0, evmAddress);
}

// Helper: get vault address
function getVaultAddress(): Address {
  if (!import.meta.env.VITE_VAULT_ADDRESS) {
    throw new Error('VITE_VAULT_ADDRESS is not set in environment variables');
  }
  return import.meta.env.VITE_VAULT_ADDRESS as Address;
}

// Helper: get mirror node url
function getMirrorNodeUrl(): string {
  if (!import.meta.env.VITE_MIRROR_NODE_URL) {
    throw new Error('VITE_MIRROR_NODE_URL is not set in environment variables');
  }
  return import.meta.env.VITE_MIRROR_NODE_URL;
}

// Helper: get token decimal
const getTokenDecimal = async (tokenEvmAddress: string) => {
  try {
    if (tokenEvmAddress === '0x0000000000000000000000000000000000000000') {
      return 8;
    }
    // Try using mirror node API instead of direct SDK query
    const tokenId = TokenId.fromEvmAddress(0, 0, tokenEvmAddress);
    
    // Use mirror node API to get token info
    const url = `${getMirrorNodeUrl()}/tokens/${tokenId.toString()}`
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to fetch token info. Error: ${data}`);
    }
    const decimals = data.decimals;
    
    return decimals;
  } catch (error) {
    console.error('[getTokenDecimal] Error:', error);
    throw error;
  }
};

// Helper: ensure the recipient account is associated with the HTS token
async function ensureTokenAssociation(
  manager: any,
  pairingData: any,
  tokenEvmAddress: string
): Promise<void> {
  if (!tokenEvmAddress || tokenEvmAddress === "0x0000000000000000000000000000000000000000") {
    return; // Native HBAR requires no association
  }
  const accountId: string = pairingData.accountIds[0];
  const tokenId = TokenId.fromEvmAddress(0, 0, tokenEvmAddress).toString();

  try {
    const url = `${getMirrorNodeUrl()}/accounts/${accountId}/tokens?token.id=${tokenId}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const associated = Array.isArray(data?.tokens) && data.tokens.length > 0;
      if (associated) return;
    }
  } catch (err) {
    // If mirror check fails, proceed to attempt association defensively
    console.warn("[ensureTokenAssociation] Mirror check failed, attempting association anyway:", err);
  }

  // Request association via wallet
  const signer = getSigner(manager, pairingData);
  const associateTx = new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(accountId))
    .setTokenIds([TokenId.fromEvmAddress(0, 0, tokenEvmAddress)]);

  await associateTx.freezeWithSigner(signer);
  const assocResult = await manager.sendTransaction(accountId, associateTx);
  

  // Wait for consensus before proceeding to swap
  try {
    const txId = assocResult?.transactionId?.toString?.();
    if (txId) {
      await waitForMirrorTransactionSuccess(txId, 30000);
      
    }
  } catch (err) {
    console.warn('[ensureTokenAssociation] Receipt wait failed, proceeding anyway:', err);
  }
}

// --- Public checkers ---
export async function isTokenAssociated(accountId: string, tokenEvmAddress: string): Promise<boolean> {
  if (!tokenEvmAddress || tokenEvmAddress === "0x0000000000000000000000000000000000000000") {
    return true;
  }
  const tokenId = TokenId.fromEvmAddress(0, 0, tokenEvmAddress).toString();
  const url = `${getMirrorNodeUrl()}/accounts/${accountId}/tokens?token.id=${tokenId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data?.tokens) && data.tokens.length > 0;
  } catch {
    return false;
  }
}

export async function checkTokenApprovalStatus({
  tokenAddress,
  owner,
  spender,
}: {
  tokenAddress: Address;
  owner: `0x${string}`;
  spender: Address;
}): Promise<{ allowance: bigint } > {
  const hederaJsonRelayUrl = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_RELAY_URL;
  if (!hederaJsonRelayUrl) {
    throw new Error('NEXT_PUBLIC_HEDERA_JSON_RPC_RELAY_URL is not set in environment variables');
  }
  const provider = new providers.JsonRpcProvider(hederaJsonRelayUrl);
  const abi = [
    'function allowance(address owner, address spender) external view returns (uint256)'
  ];
  const erc20 = new Contract(tokenAddress, abi, provider);
  const result = await erc20.allowance(owner, spender);
  const allowance = BigInt(result.toString());
  return { allowance };
}

// Mirror node receipt poller
async function waitForMirrorTransactionSuccess(transactionId: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  const url = `${getMirrorNodeUrl()}/transactions/${encodeURIComponent(transactionId)}?limit=1&order=desc`;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const entries = data?.transactions ?? [];
        const status = entries[0]?.result ?? entries[0]?.transaction_hash ? entries[0]?.result : undefined;
        if (status === 'SUCCESS') return;
        if (status && status !== 'PENDING' && status !== 'STATUS_UNKNOWN') {
          throw new Error(`Transaction failed with status: ${status}`);
        }
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error('Timeout waiting for transaction success');
}

async function checkAndApproveIfNeeded({
  pairingData,
  manager,
  tokenAddress,
  owner,
  spender,
  requiredAmount,
}: {
  pairingData: any;
  manager: any;
  tokenAddress: Address;
  owner: `0x${string}`;
  spender: Address;
  requiredAmount: bigint;
}): Promise<void> {
  const { allowance } = await checkTokenApprovalStatus({ tokenAddress, owner, spender });
  if (allowance >= requiredAmount) {
    return;
  }
  // Approve exactly requiredAmount to be safe
  const decimals = await getTokenDecimal(tokenAddress);
  const approveRes = await signTokenApproval({
    pairingData,
    manager,
    tokenAddress,
    spenderAddress: getVaultAddress(),
    amount: requiredAmount,
    decimals, // amount is already wei; decimals ignored in bigint path
  });
  if (!approveRes.success) {
    throw new Error(`Approval failed: ${approveRes.error ?? 'unknown error'}`);
  }
  // Wait for approval to finalize before swap
  if (approveRes.transactionHash) {
    try {
      await waitForMirrorTransactionSuccess(approveRes.transactionHash, 30000);
    } catch (err) {
      console.warn('[checkAndApproveIfNeeded] Receipt wait failed, proceeding anyway:', err);
    }
  }
}

// --- Token Approval ---
/**
 * Signs a transaction to approve a spender to spend tokens on behalf of the user
 * @param pairingData - HashConnect pairing data containing account information
 * @param manager - HashConnect manager instance for transaction signing
 * @param tokenAddress - The token contract address to approve
 * @param spenderAddress - The address that will be approved to spend tokens
 * @param amount - Amount of tokens to approve (can be string or bigint)
 * @param decimals - Token decimals for parsing string amounts (defaults to 18)
 * @returns Promise<SignResponse> - Transaction result with success status and hash
 */
export async function signTokenApproval({
  pairingData,
  manager,
  tokenAddress,
  spenderAddress,
  amount,
  decimals = 18,
}: {
  pairingData: any;
  manager: any;
  tokenAddress: Address;
  spenderAddress: Address;
  amount: string | bigint;
  decimals?: number;
}): Promise<SignResponse> {
  try {
    

    const amountWei = typeof amount === 'bigint' ? amount : parseUnits(amount, decimals);
    

    const signer = getSigner(manager, pairingData);

    const params = new ContractFunctionParameters()
      .addAddress(spenderAddress)
      .addUint256(Long.fromString(amountWei.toString()));

    const tx = new ContractExecuteTransaction()
      .setContractId(toContractId(tokenAddress))
      .setGas(500_000)
      .setFunction("approve", params);
  
    await tx.freezeWithSigner(signer);
    

    const sigResult = await manager.sendTransaction(pairingData.accountIds[0], tx);
    
    return {
      success: true,
      transactionHash: sigResult.transactionId?.toString?.() ?? undefined,
      data: sigResult,
    };
  } catch (error) {
    console.error('[signTokenApproval] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 