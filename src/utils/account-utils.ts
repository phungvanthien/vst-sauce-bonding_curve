import { AccountId, TokenId } from "@hashgraph/sdk"
import type { Id, Address } from '@/types/types'

// Helper: Check if is native
function isNative(tokenAddressOrId: Address | Id) {
    return tokenAddressOrId === '0x0000000000000000000000000000000000000000' || tokenAddressOrId === '0.0.0'
}

/**
 * Get account balance from mirror node
 * @param accountId - The Hedera account ID
 * @param tokenAddressOrId - The token address or ID
 * @returns The account balance of the given token. If no token is provided, return native token balance.
 */
export async function getAccountBalance(accountId: Id, tokenAddressOrId?: Address | Id) {
    if (!import.meta.env.VITE_MIRROR_NODE_URL) {
        throw new Error('VITE_MIRROR_NODE_URL is not set')
    }
    const params = new URLSearchParams()
    params.set('account.id', accountId)
    const url = `${import.meta.env.VITE_MIRROR_NODE_URL}/balances?${params.toString()}`
    const res = await fetch(url)
    const data = await res.json()
    const accountBalances = data.balances[0]
    if (tokenAddressOrId) {
        if (isNative(tokenAddressOrId)) {
            return accountBalances.balance
        }
        let tokenId: string
        if (tokenAddressOrId.startsWith('0x')) {
            const token = TokenId.fromEvmAddress(0, 0, tokenAddressOrId as Address)
            tokenId = token.toString()
        } else {
            tokenId = tokenAddressOrId as Id
        }
        const tokenBalance = accountBalances.tokens?.find((balance: any) => balance.token_id === tokenId)
        return tokenBalance?.balance ?? 0
    }
    return accountBalances
}

/**
 * Convert Hedera account ID to EVM address
 * @param accountId - The Hedera account ID
 * @returns The EVM alias address of the given Hedera account ID
 */
export async function accountIdToEvmAddress(accountId: string): Promise<`0x${string}`> {
    if (!import.meta.env.VITE_MIRROR_NODE_URL) {
        throw new Error('VITE_MIRROR_NODE_URL is not set')
    }
    const baseUrl = import.meta.env.VITE_MIRROR_NODE_URL;
  const url = `${baseUrl}/accounts/${encodeURIComponent(accountId)}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const evm = data.evm_address as string | undefined;
      if (evm && typeof evm === 'string') {
        const prefixed = evm.startsWith('0x') ? evm : `0x${evm}`;
        
        return prefixed as `0x${string}`;
      }
    }
    console.warn('[accountIdToEvmAddress] Mirror response missing evm_address, falling back to SDK conversion');
  } catch (error) {
    console.warn('[accountIdToEvmAddress] Mirror lookup failed, falling back to SDK conversion:', error);
  }
  console.log('[accountIdToEvmAddress] Mirror lookup failed, fall back triggered');
  const account = AccountId.fromString(accountId);
  const fallback = `0x${account.toEvmAddress()}` as `0x${string}`;
  
  return fallback;
}

// Helper function to add delay between operations to prevent rate limiting
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get user address based on wallet type
export function getUserAddress(user: any): string {
    if (!user) return '';
    return user.walletType === 'hashpack' ? user.accountId : user.walletAddress;
}

// Check if user is connected
export function isUserConnected(user: any): boolean {
    return !!user && (!!user.accountId || !!user.walletAddress);
}

// Validate user permissions for vault operations
export function validateUserPermissions(user: any, operation: string): void {
    if (!isUserConnected(user)) {
        throw new Error(`User must be connected to perform ${operation}`);
    }
}

// Format user address for display
export function formatUserAddress(address: string): string {
    if (!address) return '';
    if (address.startsWith('0x')) return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    return address;
}

// Testing
// getAccountBalance('0.0.9451398', '0x00000000000000000000000000000000000b2ad5')
