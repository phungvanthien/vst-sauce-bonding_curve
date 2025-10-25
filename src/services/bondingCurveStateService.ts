/**
 * Bonding Curve State Service
 * Manages persistent state for cumulative token sales
 */

const BONDING_CURVE_STATE_KEY = "vst_bonding_curve_state";

export interface BondingCurveState {
  totalTokensSold: number; // Cumulative VST tokens sold
  totalTokensBurned: number; // Cumulative VST tokens burned
  lastUpdated: number; // Timestamp
  version: string; // State version for migration
}

/**
 * Get current bonding curve state from localStorage
 */
export function getBondingCurveState(): BondingCurveState {
  try {
    const stored = localStorage.getItem(BONDING_CURVE_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and return with defaults
      return {
        totalTokensSold: parsed.totalTokensSold || 0,
        totalTokensBurned: parsed.totalTokensBurned || 0,
        lastUpdated: parsed.lastUpdated || Date.now(),
        version: parsed.version || "1.0.0"
      };
    }
  } catch (error) {
    console.error("Error loading bonding curve state:", error);
  }
  
  // Return default state
  return {
    totalTokensSold: 0,
    totalTokensBurned: 0,
    lastUpdated: Date.now(),
    version: "1.0.0"
  };
}

/**
 * Save bonding curve state to localStorage
 */
export function saveBondingCurveState(state: BondingCurveState): void {
  try {
    const updatedState = {
      ...state,
      lastUpdated: Date.now()
    };
    localStorage.setItem(BONDING_CURVE_STATE_KEY, JSON.stringify(updatedState));
    console.log("💾 Bonding curve state saved:", updatedState);
  } catch (error) {
    console.error("Error saving bonding curve state:", error);
  }
}

/**
 * Update state after a buy transaction
 */
export function updateStateAfterBuy(tokensBought: number): BondingCurveState {
  const currentState = getBondingCurveState();
  const newState = {
    ...currentState,
    totalTokensSold: currentState.totalTokensSold + tokensBought
  };
  saveBondingCurveState(newState);
  return newState;
}

/**
 * Update state after a sell transaction
 */
export function updateStateAfterSell(tokensSold: number): BondingCurveState {
  const currentState = getBondingCurveState();
  const newState = {
    ...currentState,
    totalTokensBurned: currentState.totalTokensBurned + tokensSold
  };
  saveBondingCurveState(newState);
  return newState;
}

/**
 * Reset bonding curve state (for testing or admin purposes)
 */
export function resetBondingCurveState(): void {
  const defaultState: BondingCurveState = {
    totalTokensSold: 0,
    totalTokensBurned: 0,
    lastUpdated: Date.now(),
    version: "1.0.0"
  };
  saveBondingCurveState(defaultState);
  console.log("🔄 Bonding curve state reset to default");
}

/**
 * Get bonding curve statistics
 */
export function getBondingCurveStats() {
  const state = getBondingCurveState();
  return {
    totalTokensSold: state.totalTokensSold,
    totalTokensBurned: state.totalTokensBurned,
    netTokensInCirculation: state.totalTokensSold - state.totalTokensBurned,
    lastUpdated: new Date(state.lastUpdated).toLocaleString(),
    version: state.version
  };
}

/**
 * Export state for backup or migration
 */
export function exportBondingCurveState(): string {
  const state = getBondingCurveState();
  return JSON.stringify(state, null, 2);
}

/**
 * Import state from backup
 */
export function importBondingCurveState(stateJson: string): boolean {
  try {
    const state = JSON.parse(stateJson);
    if (state.totalTokensSold !== undefined && state.totalTokensBurned !== undefined) {
      saveBondingCurveState(state);
      console.log("✅ Bonding curve state imported successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error importing bonding curve state:", error);
    return false;
  }
}
