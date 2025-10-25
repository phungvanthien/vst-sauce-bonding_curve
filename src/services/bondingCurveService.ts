import {
  Client,
  AccountId,
  PrivateKey,
  TokenTransferTransaction,
  HbarUnit,
  Hbar,
} from "@hashgraph/sdk";
import { getBondingCurveState, updateStateAfterBuy, updateStateAfterSell } from "./bondingCurveStateService";
import { getCachedTreasuryBalance } from "./treasuryBalanceService";

/**
 * Bonding Curve Service for VST Token
 * Implements a linear bonding curve with the following mechanics:
 * - Initial price: 1 HBAR = 100 VST
 * - Price increases linearly as more tokens are sold
 * - Buys: HBAR from buyer → treasury
 * - Sells: VST burned + HBAR from treasury → seller
 */

// Configuration
const CONFIG = {
  INITIAL_PRICE_SAUCE: 0.1, // 0.1 Sauce per 1 VST
  INITIAL_EXCHANGE_RATE: 1, // 1 VST = 0.1 Sauce (rate is 1:0.1)
  VST_DECIMALS: 8,
  SAUCE_DECIMALS: 8,
  K_LINEAR: 0.0001, // Linear coefficient for price increase
  MIN_PURCHASE: 1, // Minimum 1 VST
  MAX_PURCHASE: 10000, // Maximum 10,000 VST
};

export interface PricingData {
  currentPrice: number; // Sauce per VST
  averagePrice: number; // Average price for total purchase
  tokensToBuy: number;
  totalCost: number; // In Sauce
  priceImpact: number; // Percentage
}

export interface SellData {
  currentPrice: number; // Sauce per VST
  tokensToSell: number;
  sauceReceived: number; // In Sauce
  priceImpact: number; // Percentage
}

/**
 * Calculate current price based on tokens sold (linear bonding curve)
 * Price = InitialPrice * (1 + K * TokensSold)
 * Where InitialPrice = 0.1 Sauce per 1 VST
 */
function calculatePrice(tokensSold: number): number {
  const initialPricePerVst = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;
  const pricePerVst = initialPricePerVst * (1 + CONFIG.K_LINEAR * tokensSold);
  return pricePerVst;
}

/**
 * Get current price based on Treasury balance (real-time)
 */
export async function getCurrentPrice(): Promise<number> {
  try {
    const treasuryBalance = await getCachedTreasuryBalance();
    return calculatePrice(treasuryBalance.tokensSold);
  } catch (error) {
    console.error('Error getting current price from Treasury:', error);
    // Fallback to localStorage state
    const state = getBondingCurveState();
    return calculatePrice(state.totalTokensSold);
  }
}

/**
 * Calculate cost to buy X tokens using integral of bonding curve
 * Cost = Integral[InitialPrice * (1 + K * t) dt] from currentTokensSold to currentTokensSold + X
 */
export async function calculateBuyCost(tokensToBuy: number): Promise<PricingData> {
  if (tokensToBuy < CONFIG.MIN_PURCHASE || tokensToBuy > CONFIG.MAX_PURCHASE) {
    throw new Error(
      `Purchase amount must be between ${CONFIG.MIN_PURCHASE} and ${CONFIG.MAX_PURCHASE} VST`
    );
  }

  try {
    // Get real-time Treasury balance
    const treasuryBalance = await getCachedTreasuryBalance();
    const currentTokensSold = treasuryBalance.tokensSold;
    
    const initialPricePerVst = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;

    // Calculate cost using integral from currentTokensSold to currentTokensSold + tokensToBuy
    const startPoint = currentTokensSold;
    const endPoint = currentTokensSold + tokensToBuy;
    
    const firstTerm = initialPricePerVst * tokensToBuy;
    const secondTerm = (initialPricePerVst * CONFIG.K_LINEAR * (endPoint ** 2 - startPoint ** 2)) / 2;
    const totalCost = firstTerm + secondTerm;

    // Current price after purchase
    const currentPrice = calculatePrice(endPoint);

    // Average price
    const averagePrice = totalCost / tokensToBuy;

    // Price impact (percentage)
    const initialPrice = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;
    const priceImpact = ((currentPrice - initialPrice) / initialPrice) * 100;

    return {
      currentPrice,
      averagePrice,
      tokensToBuy,
      totalCost,
      priceImpact,
    };
  } catch (error) {
    console.error('Error calculating buy cost from Treasury:', error);
    // Fallback to localStorage state
    const state = getBondingCurveState();
    const currentTokensSold = state.totalTokensSold;
    
    const initialPricePerVst = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;
    const startPoint = currentTokensSold;
    const endPoint = currentTokensSold + tokensToBuy;
    
    const firstTerm = initialPricePerVst * tokensToBuy;
    const secondTerm = (initialPricePerVst * CONFIG.K_LINEAR * (endPoint ** 2 - startPoint ** 2)) / 2;
    const totalCost = firstTerm + secondTerm;
    const currentPrice = calculatePrice(endPoint);
    const averagePrice = totalCost / tokensToBuy;
    const initialPrice = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;
    const priceImpact = ((currentPrice - initialPrice) / initialPrice) * 100;

    return {
      currentPrice,
      averagePrice,
      tokensToBuy,
      totalCost,
      priceImpact,
    };
  }
}

/**
 * Calculate Sauce received from selling tokens (real-time from Treasury)
 * Sells burn tokens and withdraw from treasury
 */
export async function calculateSellProceeds(tokensToSell: number): Promise<SellData> {
  if (tokensToSell < CONFIG.MIN_PURCHASE || tokensToSell > CONFIG.MAX_PURCHASE) {
    throw new Error(
      `Sell amount must be between ${CONFIG.MIN_PURCHASE} and ${CONFIG.MAX_PURCHASE} VST`
    );
  }

  try {
    // Get real-time Treasury balance
    const treasuryBalance = await getCachedTreasuryBalance();
    const currentTokensSold = treasuryBalance.tokensSold;
    
    const initialPricePerVst = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;

    // Calculate proceeds using integral from currentTokensSold to currentTokensSold - tokensToSell
    // For sell, we go backwards in the curve
    const startPoint = currentTokensSold;
    const endPoint = Math.max(0, currentTokensSold - tokensToSell); // Can't go below 0
    
    const firstTerm = initialPricePerVst * tokensToSell;
    const secondTerm = (initialPricePerVst * CONFIG.K_LINEAR * (startPoint ** 2 - endPoint ** 2)) / 2;
    const totalReceived = firstTerm + secondTerm;

    // Current price before sell
    const currentPrice = calculatePrice(currentTokensSold);
    const priceImpact = ((currentPrice - initialPricePerVst) / initialPricePerVst) * 100;

    return {
      currentPrice,
      tokensToSell,
      sauceReceived: totalReceived,
      priceImpact,
    };
  } catch (error) {
    console.error('Error calculating sell proceeds from Treasury:', error);
    // Fallback to localStorage state
    const state = getBondingCurveState();
    const currentTokensSold = state.totalTokensSold;
    
    const initialPricePerVst = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;
    const startPoint = currentTokensSold;
    const endPoint = Math.max(0, currentTokensSold - tokensToSell);
    
    const firstTerm = initialPricePerVst * tokensToSell;
    const secondTerm = (initialPricePerVst * CONFIG.K_LINEAR * (startPoint ** 2 - endPoint ** 2)) / 2;
    const totalReceived = firstTerm + secondTerm;
    const currentPrice = calculatePrice(currentTokensSold);
    const priceImpact = ((currentPrice - initialPricePerVst) / initialPricePerVst) * 100;

    return {
      currentPrice,
      tokensToSell,
      sauceReceived: totalReceived,
      priceImpact,
    };
  }
}

/**
 * Get current bonding curve status (real-time from Treasury)
 */
export async function getBondingCurveStatus() {
  try {
    const treasuryBalance = await getCachedTreasuryBalance();
    const initialPrice = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;
    const currentPrice = await getCurrentPrice();

    return {
      initialPrice,
      currentPrice, // Real-time price based on Treasury balance
      totalTokensSold: treasuryBalance.tokensSold,
      totalTokensBurned: 0, // Will be calculated from burn history
      netTokensInCirculation: treasuryBalance.tokensSold,
      treasuryBalance: treasuryBalance.balanceDisplay,
      tokensRemaining: treasuryBalance.balanceDisplay,
      initialExchangeRate: CONFIG.INITIAL_PRICE_SAUCE, // Show 0.1 instead of 1
      currentExchangeRate: currentPrice, // Real-time exchange rate
      linearCoefficient: CONFIG.K_LINEAR,
      minPurchase: CONFIG.MIN_PURCHASE,
      maxPurchase: CONFIG.MAX_PURCHASE,
      vstDecimals: CONFIG.VST_DECIMALS,
      sauceDecimals: CONFIG.SAUCE_DECIMALS,
    };
  } catch (error) {
    console.error('Error getting bonding curve status from Treasury:', error);
    // Fallback to localStorage state
    const state = getBondingCurveState();
    const initialPrice = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;
    const currentPrice = calculatePrice(state.totalTokensSold);

    return {
      initialPrice,
      currentPrice,
      totalTokensSold: state.totalTokensSold,
      totalTokensBurned: state.totalTokensBurned,
      netTokensInCirculation: state.totalTokensSold - state.totalTokensBurned,
      treasuryBalance: 100000 - state.totalTokensSold,
      tokensRemaining: 100000 - state.totalTokensSold,
      initialExchangeRate: CONFIG.INITIAL_PRICE_SAUCE,
      currentExchangeRate: currentPrice, // Real-time exchange rate
      linearCoefficient: CONFIG.K_LINEAR,
      minPurchase: CONFIG.MIN_PURCHASE,
      maxPurchase: CONFIG.MAX_PURCHASE,
      vstDecimals: CONFIG.VST_DECIMALS,
      sauceDecimals: CONFIG.SAUCE_DECIMALS,
    };
  }
}

/**
 * Format price for display
 */
export function formatPrice(priceInSauce: number): string {
  return `${priceInSauce.toFixed(8)} Sauce`;
}

/**
 * Convert display amount to raw amount (considering decimals)
 */
export function toRawAmount(displayAmount: number, decimals: number): bigint {
  const multiplier = 10 ** decimals;
  return BigInt(Math.round(displayAmount * multiplier));
}

/**
 * Convert raw amount to display amount
 */
export function fromRawAmount(rawAmount: bigint | number, decimals: number): number {
  const divisor = 10 ** decimals;
  return Number(rawAmount) / divisor;
}

/**
 * Execute buy transaction
 * Transfer Sauce from buyer to treasury, and VST from treasury to buyer
 */
export async function executeBuyTransaction(
  buyerAccountId: string,
  treasuryAccountId: string,
  vstTokenId: string,
  sauceAmount: number,
  vstAmount: number,
  sauceAccountPrivateKey?: string
): Promise<any> {
  try {
    console.log("🔄 Executing buy transaction...");
    console.log(`   Buyer: ${buyerAccountId}`);
    console.log(`   Sauce Amount: ${sauceAmount}`);
    console.log(`   VST Amount: ${vstAmount}`);

    // For now, return transaction data (actual execution would require proper signing)
    return {
      status: "PENDING",
      transactionType: "BUY",
      buyerAccountId,
      treasuryAccountId,
      sauceAmount,
      vstAmount,
      vstTokenId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Buy transaction failed:", error);
    throw error;
  }
}

/**
 * Execute sell transaction
 * Burn VST and transfer Sauce from treasury to seller
 */
export async function executeSellTransaction(
  sellerAccountId: string,
  treasuryAccountId: string,
  vstTokenId: string,
  vstAmount: number,
  sauceAmount: number,
  sauceAccountPrivateKey?: string
): Promise<any> {
  try {
    console.log("🔄 Executing sell transaction...");
    console.log(`   Seller: ${sellerAccountId}`);
    console.log(`   VST Amount: ${vstAmount}`);
    console.log(`   Sauce Received: ${sauceAmount}`);

    // For now, return transaction data (actual execution would require proper signing)
    return {
      status: "PENDING",
      transactionType: "SELL",
      sellerAccountId,
      treasuryAccountId,
      vstAmount,
      sauceAmount,
      vstTokenId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Sell transaction failed:", error);
    throw error;
  }
}

/**
 * Get price history simulation (for chart display)
 */
export function getPriceHistory(maxTokens: number = 50000, steps: number = 50): Array<{
  tokens: number;
  price: number;
  cumulative: number;
}> {
  const history = [];
  const stepSize = Math.floor(maxTokens / steps);

  for (let i = 0; i < steps; i++) {
    const tokens = i * stepSize;
    const price = calculatePrice(tokens);
    let cumulative = 0;
    if (tokens >= CONFIG.MIN_PURCHASE) {
      cumulative = calculateBuyCost(Math.min(tokens, CONFIG.MAX_PURCHASE)).totalCost;
    }

    history.push({
      tokens,
      price,
      cumulative,
    });
  }

  return history;
}

/**
 * Export all utilities
 */
export const BondingCurveUtils = {
  CONFIG,
  calculateBuyCost,
  calculateSellProceeds,
  getBondingCurveStatus,
  calculatePrice,
  formatPrice,
  toRawAmount,
  fromRawAmount,
  executeBuyTransaction,
  executeSellTransaction,
  getPriceHistory,
};

