/**
 * VST Burn History Service
 * Tracks and manages VST token burn transactions
 */

export interface BurnRecord {
  id: string;
  txId: string;
  amount: number; // VST amount burned
  timestamp: number;
  seller: string;
  sauceReceived: number; // Sauce amount received by seller
  status: 'completed' | 'pending' | 'failed';
}

const STORAGE_KEY = 'vst_burn_history';

/**
 * Save a burn record to local storage
 */
export function saveBurnRecord(record: Omit<BurnRecord, 'id' | 'timestamp'>): BurnRecord {
  const burnRecord: BurnRecord = {
    id: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...record,
  };

  const existingBurns = getAllBurnRecords();
  existingBurns.push(burnRecord);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingBurns));
    console.log('🔥 Burn record saved:', burnRecord);
    return burnRecord;
  } catch (error) {
    console.error('❌ Failed to save burn record:', error);
    throw error;
  }
}

/**
 * Get all burn records from local storage
 */
export function getAllBurnRecords(): BurnRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const burns = JSON.parse(stored);
    return Array.isArray(burns) ? burns : [];
  } catch (error) {
    console.error('❌ Failed to load burn records:', error);
    return [];
  }
}

/**
 * Get burn records for a specific seller
 */
export function getSellerBurnRecords(seller: string): BurnRecord[] {
  return getAllBurnRecords().filter(burn => burn.seller === seller);
}

/**
 * Get recent burn records (last N records)
 */
export function getRecentBurnRecords(limit: number = 10): BurnRecord[] {
  const allBurns = getAllBurnRecords();
  return allBurns
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Get burn statistics
 */
export function getBurnStats() {
  const allBurns = getAllBurnRecords();
  const completedBurns = allBurns.filter(burn => burn.status === 'completed');
  
  const totalBurned = completedBurns.reduce((sum, burn) => sum + burn.amount, 0);
  const totalSaucePaid = completedBurns.reduce((sum, burn) => sum + burn.sauceReceived, 0);
  const burnCount = completedBurns.length;
  
  return {
    totalBurned,
    totalSaucePaid,
    burnCount,
    averageBurnAmount: burnCount > 0 ? totalBurned / burnCount : 0,
    averageSaucePerBurn: burnCount > 0 ? totalSaucePaid / burnCount : 0,
  };
}

/**
 * Get burn history for chart data
 */
export function getBurnHistoryForChart(days: number = 30): Array<{
  date: string;
  burned: number;
  saucePaid: number;
  burnCount: number;
}> {
  const allBurns = getAllBurnRecords();
  const completedBurns = allBurns.filter(burn => burn.status === 'completed');
  
  const now = Date.now();
  const daysAgo = now - (days * 24 * 60 * 60 * 1000);
  const recentBurns = completedBurns.filter(burn => burn.timestamp >= daysAgo);
  
  // Group by date
  const groupedByDate: { [key: string]: BurnRecord[] } = {};
  
  recentBurns.forEach(burn => {
    const date = new Date(burn.timestamp).toISOString().split('T')[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(burn);
  });
  
  // Convert to chart data
  const chartData = Object.entries(groupedByDate).map(([date, burns]) => ({
    date,
    burned: burns.reduce((sum, burn) => sum + burn.amount, 0),
    saucePaid: burns.reduce((sum, burn) => sum + burn.sauceReceived, 0),
    burnCount: burns.length,
  }));
  
  return chartData.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Clear all burn records
 */
export function clearAllBurnRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🔥 All burn records cleared');
  } catch (error) {
    console.error('❌ Failed to clear burn records:', error);
  }
}

/**
 * Clear burn records for a specific seller
 */
export function clearSellerBurnRecords(seller: string): void {
  try {
    const allBurns = getAllBurnRecords();
    const filteredBurns = allBurns.filter(burn => burn.seller !== seller);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredBurns));
    console.log(`🔥 Burn records cleared for seller: ${seller}`);
  } catch (error) {
    console.error('❌ Failed to clear seller burn records:', error);
  }
}

/**
 * Format burn record for display
 */
export function formatBurnRecord(burn: BurnRecord): {
  id: string;
  txId: string;
  amount: string;
  sauceReceived: string;
  time: string;
  status: string;
} {
  return {
    id: burn.id,
    txId: burn.txId,
    amount: (burn.amount / 100000000).toFixed(2), // Convert from raw units
    sauceReceived: burn.sauceReceived.toFixed(6),
    time: new Date(burn.timestamp).toLocaleString(),
    status: burn.status,
  };
}
