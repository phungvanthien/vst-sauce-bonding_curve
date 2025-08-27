/**
 * Convert Hedera contract ID to EVM address
 * @param contractId - The Hedera contract ID
 * @returns The EVM alias address of the given Hedera contract ID
 */
export async function contractIdToEvmAliasAddress(contractId: string): Promise<`0x${string}`> {
    try {
        if (!import.meta.env.VITE_MIRROR_NODE_URL) {
            throw new Error('VITE_MIRROR_NODE_URL is not set')
        }
        const baseUrl = import.meta.env.VITE_MIRROR_NODE_URL;
        const url = `${baseUrl}/contracts/${encodeURIComponent(contractId)}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const evm = data.evm_address as string;
            return (evm.startsWith('0x') ? evm : `0x${evm}`) as `0x${string}`;
        }
        throw new Error('Failed to convert Hedera contract ID to EVM address');
    } catch (error) {
        console.error('❌ Error converting contract ID to EVM address:', error);
        throw new Error('Error converting contract ID to EVM address');
    }
}

/**
 * Convert EVM alias address to Hedera contract ID
 * @param evmAddress - The EVM alias address
 * @returns The Hedera contract ID of the given EVM alias address
 */
export async function evmAliasAddressToContractId(evmAddress: string): Promise<string> {
    const baseUrl = 'https://mainnet.mirrornode.hedera.com/api/v1';
    const url = `${baseUrl}/contracts/${encodeURIComponent(evmAddress)}`;
    const res = await fetch(url);
    if (res.ok) {
        const data = await res.json();
        const cid = data.contract_id as string;
        return cid;
    }
    throw new Error('Failed to convert EVM address to Hedera contract ID');
}
