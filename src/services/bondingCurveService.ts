import {
  Client,
  AccountId,
  PrivateKey,
  TokenTransferTransaction,
  HbarUnit,
  Hbar,
} from "@hashgraph/sdk";

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
 * Calculate cost to buy X tokens using integral of bonding curve
 * Cost = Integral[InitialPrice * (1 + K * t) dt] from 0 to X
 */
export function calculateBuyCost(tokensToBuy: number): PricingData {
  if (tokensToBuy < CONFIG.MIN_PURCHASE || tokensToBuy > CONFIG.MAX_PURCHASE) {
    throw new Error(
      `Purchase amount must be between ${CONFIG.MIN_PURCHASE} and ${CONFIG.MAX_PURCHASE} VST`
    );
  }

  const initialPricePerVst =
    CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;

  // Integral calculation for linear curve
  // Cost = P0 * n + (P0 * K * n^2) / 2
  const firstTerm = initialPricePerVst * tokensToBuy;
  const secondTerm = (initialPricePerVst * CONFIG.K_LINEAR * tokensToBuy ** 2) / 2;
  const totalCost = firstTerm + secondTerm;

  // Current price after purchase
  const currentPrice = calculatePrice(tokensToBuy);

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
}

/**
 * Calculate HBAR received from selling tokens
 * Sells burn tokens and withdraw from treasury
 */
export function calculateSellProceeds(tokensToSell: number): SellData {
  if (tokensToSell < CONFIG.MIN_PURCHASE || tokensToSell > CONFIG.MAX_PURCHASE) {
    throw new Error(
      `Sell amount must be between ${CONFIG.MIN_PURCHASE} and ${CONFIG.MAX_PURCHASE} VST`
    );
  }

  const initialPricePerVst =
    CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;

  // Same formula but for sell (tokens are removed from circulation)
  const firstTerm = initialPricePerVst * tokensToSell;
  const secondTerm = (initialPricePerVst * CONFIG.K_LINEAR * tokensToSell ** 2) / 2;
  const totalReceived = firstTerm + secondTerm;

  const currentPrice = calculatePrice(tokensToSell);
  const priceImpact = ((currentPrice - initialPricePerVst) / initialPricePerVst) * 100;

  return {
    currentPrice,
    tokensToSell,
    sauceReceived: totalReceived, // Fix: use sauceReceived instead of totalReceived
    priceImpact,
  };
}

/**
 * Get current bonding curve status
 */
export function getBondingCurveStatus() {
  const initialPrice = CONFIG.INITIAL_PRICE_SAUCE / CONFIG.INITIAL_EXCHANGE_RATE;

  return {
    initialPrice,
    currentPrice: calculatePrice(0), // At 0 sold tokens
    initialExchangeRate: CONFIG.INITIAL_PRICE_SAUCE, // Show 0.1 instead of 1
    linearCoefficient: CONFIG.K_LINEAR,
    minPurchase: CONFIG.MIN_PURCHASE,
    maxPurchase: CONFIG.MAX_PURCHASE,
    vstDecimals: CONFIG.VST_DECIMALS,
    sauceDecimals: CONFIG.SAUCE_DECIMALS,
  };
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

