/**
 * Trade History Service
 * Manages trading history for bonding curve transactions
 */

export interface TradeRecord {
  id: string;
  type: "buy" | "sell";
  account: string;
  amount: number; // VST amount
  cost: number; // Sauce cost/proceeds
  txId: string;
  timestamp: number;
  status: "completed" | "pending" | "failed";
}

const STORAGE_KEY = "bonding_curve_trades";
const MAX_TRADES_PER_ACCOUNT = 50;

/**
 * Save a trade record to local storage
 */
export function saveTradeRecord(record: Omit<TradeRecord, 'id' | 'timestamp'>): TradeRecord {
  const tradeRecord: TradeRecord = {
    ...record,
    id: `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  };

  try {
    const allTrades = getAllTrades();
    const accountTrades = allTrades.filter(t => t.account === record.account);
    
    // Keep only last MAX_TRADES_PER_ACCOUNT trades per account
    if (accountTrades.length >= MAX_TRADES_PER_ACCOUNT) {
      const otherTrades = allTrades.filter(t => t.account !== record.account);
      const updatedAccountTrades = accountTrades.slice(1); // Remove oldest
      const updatedTrades = [...otherTrades, ...updatedAccountTrades, tradeRecord];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrades));
    } else {
      allTrades.push(tradeRecord);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allTrades));
    }

    console.log(`✅ Trade saved: ${record.type} ${record.amount} VST`);
    return tradeRecord;
  } catch (error) {
    console.error("❌ Failed to save trade record:", error);
    throw error;
  }
}

/**
 * Get all trades from local storage
 */
export function getAllTrades(): TradeRecord[] {
  try {
    const trades = localStorage.getItem(STORAGE_KEY);
    if (!trades) return [];
    
    const parsed = JSON.parse(trades);
    // Ensure all trades have required properties
    return parsed.filter((trade: any) => 
      trade && 
      typeof trade.amount === 'number' && 
      typeof trade.cost === 'number' &&
      trade.txId
    );
  } catch (error) {
    console.error("❌ Failed to load trades:", error);
    return [];
  }
}

/**
 * Get trades for a specific account
 */
export function getAccountTrades(account: string): TradeRecord[] {
  try {
    const allTrades = getAllTrades();
    return allTrades
      .filter(t => t.account === account)
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.error("❌ Failed to load account trades:", error);
    return [];
  }
}

/**
 * Get recent trades for a specific account (limit)
 */
export function getRecentTrades(account: string, limit: number = 10): TradeRecord[] {
  return getAccountTrades(account).slice(0, limit);
}

/**
 * Clear all trades for a specific account
 */
export function clearAccountTrades(account: string): void {
  try {
    const allTrades = getAllTrades();
    const updatedTrades = allTrades.filter(t => t.account !== account);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrades));
    console.log(`✅ Cleared trades for account: ${account}`);
  } catch (error) {
    console.error("❌ Failed to clear trades:", error);
    throw error;
  }
}

/**
 * Clear all trades
 */
export function clearAllTrades(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("✅ All trades cleared");
  } catch (error) {
    console.error("❌ Failed to clear all trades:", error);
    throw error;
  }
}

/**
 * Get trade statistics for an account
 */
export function getTradeStats(account: string) {
  const trades = getAccountTrades(account);
  
  const buyTrades = trades.filter(t => t.type === "buy");
  const sellTrades = trades.filter(t => t.type === "sell");
  
  const totalBuyVST = buyTrades.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSellVST = sellTrades.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalBuyHBAR = buyTrades.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalSellHBAR = sellTrades.reduce((sum, t) => sum + (t.cost || 0), 0);
  
  return {
    totalTrades: trades.length,
    buyCount: buyTrades.length,
    sellCount: sellTrades.length,
    totalBuyVST,
    totalSellVST,
    totalBuyHBAR,
    totalSellHBAR,
    netVST: totalBuyVST - totalSellVST,
    netHBAR: totalSellHBAR - totalBuyHBAR, // Positive if user earned HBAR
  };
}

/**
 * Format trade record for display
 */
export function formatTradeRecord(trade: TradeRecord): {
  type: string;
  amount: string;
  cost: string;
  time: string;
  txIdShort: string;
} {
  const date = new Date(trade.timestamp);
  const timeStr = date.toLocaleTimeString();
  const dateStr = date.toLocaleDateString();
  
  return {
    type: trade.type === "buy" ? "Buy" : "Sell",
    amount: `${(trade.amount || 0).toFixed(2)} VST`,
    cost: `${(trade.cost || 0).toFixed(4)} HBAR`,
    time: `${dateStr} ${timeStr}`,
    txIdShort: trade.txId.substring(0, 20) + "...",
  };
}

