export const tokenAddress = {
    whbar: '0x0000000000000000000000000000000000163b5a',
    sauce: '0x00000000000000000000000000000000000b2ad5',
    xsauce: '0x00000000000000000000000000000000001647e8',
    usdt: '0x0000000000000000000000000000000000101af0',
    usdc: "0x000000000000000000000000000000000006f89a",
}

// Reverse mapping to get token symbol from address
export const getTokenSymbolFromAddress = (address: string): string => {
    const addressLower = address.toLowerCase();
    for (const [symbol, addr] of Object.entries(tokenAddress)) {
        if (addr.toLowerCase() === addressLower) {
            return symbol.toUpperCase();
        }
    }
    return ''; // Default fallback
};

// Get token address from symbol
export const getTokenAddressFromSymbol = (symbol: string): string => {
    const symbolLower = symbol.toLowerCase();
    return tokenAddress[symbolLower as keyof typeof tokenAddress] || '';
};
