import type { Id, Address } from '@/types/types'
import { TokenId } from '@hashgraph/sdk'

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
                console.log('[token-utils] Cache loaded from localStorage:', Object.keys(memoryCache || {}).length, 'entries')
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
            console.log('[token-utils] Cache saved to localStorage:', Object.keys(cache).length, 'entries')
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
        console.log('[token-utils] Cache hit for:', tokenAddressOrIdString, 'decimal:', cachedDecimal)
        return cachedDecimal
    }

    console.log('[token-utils] Cache miss for:', tokenAddressOrIdString, '- fetching from API')
    
    let tokenIdString: string
    if (tokenAddressOrIdString.startsWith('0x')) {
        const tokenId = TokenId.fromEvmAddress(0, 0, tokenAddressOrIdString as Address)
        tokenIdString = tokenId.toString()
    } else {
        tokenIdString = tokenAddressOrIdString as Id
    }
    
    console.log('[token-utils] tokenIdString:', tokenIdString)
    
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
        
        console.log('[token-utils] Cached decimal for:', tokenAddressOrIdString, 'decimal:', decimal)
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
    return Math.round(amountUnits * factor);
}

// Convert smallest units to human units using token decimals
export async function fromSmallestUnits(amountSmallest: number, tokenType?: string): Promise<number> {
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

// Check if token is HBAR
export function isHBARToken(tokenType: string): boolean {
    return tokenType === 'HBAR';
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

// Convert Hedera contract ID to EVM address (0x...) string
export function hederaContractIdToEvmAddress(contractId: string): string {
    try {
        // For now, return a placeholder since this function isn't used in the current codebase
        // and the dynamic import approach would require making this function async
        console.warn('hederaContractIdToEvmAddress: This function needs to be refactored for browser compatibility');
        return '0x' + '0'.repeat(40);
    } catch (error) {
        console.error('❌ Error converting contract ID to EVM address:', error);
        return '0x' + '0'.repeat(40);
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
            console.log('[token-utils] Cache cleared from localStorage')
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
