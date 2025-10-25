/**
 * Treasury Balance Service
 * Queries real-time VST token balance from Hedera Treasury
 */

const TREASURY_ACCOUNT_ID = import.meta.env.VITE_TREASURY_ID || "0.0.9451398";
const VST_TOKEN_ID = import.meta.env.VITE_VST_TOKEN_ID || "0.0.10048687";
const MIRROR_NODE_URL = import.meta.env.VITE_MIRROR_NODE_URL || "https://mainnet.mirrornode.hedera.com/api/v1";

export interface TreasuryBalance {
  accountId: string;
  tokenId: string;
  balance: number; // Raw balance (8 decimals)
  balanceDisplay: number; // Display balance (normalized)
  tokensSold: number; // 100,000 - balance
  lastUpdated: number;
}

/**
 * Query Treasury VST token balance from Hedera Mirror Node
 */
export async function getTreasuryBalance(): Promise<TreasuryBalance> {
  try {
    console.log('📡 Querying Treasury VST balance...');
    console.log(`   Treasury: ${TREASURY_ACCOUNT_ID}`);
    console.log(`   Token: ${VST_TOKEN_ID}`);
    
    const response = await fetch(`${MIRROR_NODE_URL}/accounts/${TREASURY_ACCOUNT_ID}/tokens`);
    
    if (!response.ok) {
      throw new Error(`Mirror node request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Treasury tokens data:', data);
    
    // Find VST token in the list
    const vstToken = data.tokens?.find((token: any) => 
      token.token_id === VST_TOKEN_ID
    );
    
    if (!vstToken) {
      throw new Error(`VST token ${VST_TOKEN_ID} not found in Treasury`);
    }
    
    const balance = vstToken.balance || 0;
    const balanceDisplay = balance / 100000000; // Convert from raw to display (8 decimals)
    const tokensSold = 100000 - balanceDisplay; // 100,000 initial - current balance
    
    console.log('✅ Treasury balance retrieved:');
    console.log(`   Raw Balance: ${balance}`);
    console.log(`   Display Balance: ${balanceDisplay.toFixed(2)} VST`);
    console.log(`   Tokens Sold: ${tokensSold.toFixed(2)} VST`);
    
    return {
      accountId: TREASURY_ACCOUNT_ID,
      tokenId: VST_TOKEN_ID,
      balance,
      balanceDisplay,
      tokensSold,
      lastUpdated: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Error querying Treasury balance:', error);
    throw error;
  }
}

/**
 * Get Treasury balance with caching (5 minutes)
 */
let cachedBalance: TreasuryBalance | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedTreasuryBalance(): Promise<TreasuryBalance> {
  const now = Date.now();
  
  if (cachedBalance && now < cacheExpiry) {
    console.log('📋 Using cached Treasury balance');
    return cachedBalance;
  }
  
  console.log('🔄 Fetching fresh Treasury balance...');
  const balance = await getTreasuryBalance();
  
  cachedBalance = balance;
  cacheExpiry = now + CACHE_DURATION;
  
  return balance;
}

/**
 * Force refresh Treasury balance (bypass cache)
 */
export async function refreshTreasuryBalance(): Promise<TreasuryBalance> {
  console.log('🔄 Force refreshing Treasury balance...');
  cachedBalance = null;
  cacheExpiry = 0;
  return await getTreasuryBalance();
}

/**
 * Get Treasury statistics
 */
export async function getTreasuryStats() {
  const balance = await getCachedTreasuryBalance();
  
  return {
    treasuryBalance: balance.balanceDisplay,
    tokensSold: balance.tokensSold,
    tokensRemaining: balance.balanceDisplay,
    sellPercentage: (balance.tokensSold / 100000) * 100,
    lastUpdated: new Date(balance.lastUpdated).toLocaleString()
  };
}
