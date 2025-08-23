import type { Id, Address } from '@/types/types'
import { TokenId } from '@hashgraph/sdk'

// Helper: Check if is native
function isNative(tokenAddressOrId: Address | Id) {
    return tokenAddressOrId === '0x0000000000000000000000000000000000000000' || tokenAddressOrId === '0.0.0'
}

export async function getTokenDecimal(tokenAddressOrId: Address | Id) {
    if (!import.meta.env.VITE_MIRROR_NODE_URL) {
        throw new Error('VITE_MIRROR_NODE_URL is not set')
    }

    if (isNative(tokenAddressOrId)) {
        return 8
    }
    let tokenIdString: string
    if ((tokenAddressOrId as string).startsWith('0x')) {
        const tokenId = TokenId.fromEvmAddress(0, 0, tokenAddressOrId as Address)
        tokenIdString = tokenId.toString()
    } else {
        tokenIdString = tokenAddressOrId as Id
    }

    const res = await fetch(`${import.meta.env.VITE_MIRROR_NODE_URL}/tokens/${tokenIdString}`)
    const data = await res.json()
    return data.decimals
}

// // Token decimals helper (defaults to 6 for USD tokens)
// export function getTokenDecimals(tokenType?: string): number {
//     if (tokenType === 'HBAR') {
//         return 8;
//     }
//     // Default to 6 for USD tokens like USDC
//     return 6;
// }

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
        const { ContractId } = require('@hashgraph/sdk');
        const cid = ContractId.fromString(contractId);
        const solidity = cid.toSolidityAddress();
        return `0x${solidity}`;
    } catch (error) {
        console.error('❌ Error converting contract ID to EVM address:', error);
        return '0x' + '0'.repeat(40);
    }
}
