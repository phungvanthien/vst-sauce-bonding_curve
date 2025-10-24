/**
 * VST Token Utility Functions
 * Helper functions for working with VST token on Hedera
 */

import { TokenId } from "@hashgraph/sdk";

// Token Constants
export const VST_TOKEN = {
  ID: "0.0.10048687",
  NAME: "Vistia Token",
  SYMBOL: "VST",
  DECIMALS: 8,
  MAX_SUPPLY: 100000,
  TREASURY: "0.0.9451398",
};

/**
 * Convert raw token amount to display amount (considering decimals)
 * @param rawAmount - Amount in smallest units
 * @returns Formatted amount as string
 */
export function formatVST(rawAmount) {
  const divisor = 10 ** VST_TOKEN.DECIMALS;
  const displayAmount = Number(rawAmount) / divisor;
  return displayAmount.toFixed(VST_TOKEN.DECIMALS);
}

/**
 * Convert display amount to raw token amount
 * @param displayAmount - Amount as displayed (e.g., "100.5")
 * @returns Raw amount as BigInt
 */
export function toRawVST(displayAmount) {
  const multiplier = 10 ** VST_TOKEN.DECIMALS;
  const rawAmount = BigInt(Math.round(Number(displayAmount) * multiplier));
  return rawAmount;
}

/**
 * Get TokenId object for VST
 * @returns TokenId instance
 */
export function getVSTTokenId() {
  return TokenId.fromString(VST_TOKEN.ID);
}

/**
 * Format large numbers with commas
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num) {
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Validate VST amount
 * @param amount - Amount to validate
 * @returns true if valid, false otherwise
 */
export function isValidVSTAmount(amount) {
  if (typeof amount !== "number" && typeof amount !== "string") return false;
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return false;
  if (num > VST_TOKEN.MAX_SUPPLY) return false;
  return true;
}

/**
 * Get VST token information object
 * @returns Token information
 */
export function getVSTInfo() {
  return {
    name: VST_TOKEN.NAME,
    symbol: VST_TOKEN.SYMBOL,
    decimals: VST_TOKEN.DECIMALS,
    tokenId: VST_TOKEN.ID,
    maxSupply: VST_TOKEN.MAX_SUPPLY,
    treasury: VST_TOKEN.TREASURY,
    unitName: `1 ${VST_TOKEN.SYMBOL} = ${10 ** VST_TOKEN.DECIMALS} smallest units`,
  };
}

/**
 * Get transfer fee info
 * Estimate Hedera transaction fee for VST transfer
 * @returns Estimated fee in HBAR
 */
export function estimateTransferFee() {
  // Hedera typical token transfer fee is around 1 HBAR per transaction
  return 1;
}

/**
 * Format token balance for display
 * @param rawBalance - Raw balance from chain
 * @param showSymbol - Whether to include symbol
 * @returns Formatted balance string
 */
export function formatBalance(rawBalance, showSymbol = true) {
  const formatted = formatVST(rawBalance);
  if (showSymbol) {
    return `${formatted} ${VST_TOKEN.SYMBOL}`;
  }
  return formatted;
}

/**
 * Parse raw balance for calculations
 * @param rawBalance - Raw balance from chain
 * @returns Numeric balance
 */
export function parseBalance(rawBalance) {
  return Number(formatVST(rawBalance));
}

/**
 * Get percentage of total supply
 * @param amount - Amount in display format
 * @returns Percentage string
 */
export function getSupplyPercentage(amount) {
  const percentage = (Number(amount) / VST_TOKEN.MAX_SUPPLY) * 100;
  return percentage.toFixed(2);
}

/**
 * Calculate token distribution
 * @param recipients - Array of {address, percentage}
 * @returns Array of {address, amount}
 */
export function calculateDistribution(recipients) {
  return recipients.map((recipient) => ({
    address: recipient.address,
    percentage: recipient.percentage,
    amount: toRawVST((VST_TOKEN.MAX_SUPPLY * recipient.percentage) / 100),
    displayAmount: formatVST(
      toRawVST((VST_TOKEN.MAX_SUPPLY * recipient.percentage) / 100)
    ),
  }));
}

// Export everything as default object for CommonJS compatibility
export default {
  VST_TOKEN,
  formatVST,
  toRawVST,
  getVSTTokenId,
  formatNumber,
  isValidVSTAmount,
  getVSTInfo,
  estimateTransferFee,
  formatBalance,
  parseBalance,
  getSupplyPercentage,
  calculateDistribution,
};

