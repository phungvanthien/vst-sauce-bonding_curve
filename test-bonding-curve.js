// Test Bonding Curve Algorithm
const CONFIG = {
  INITIAL_PRICE_HBAR: 1, // 1 HBAR
  INITIAL_EXCHANGE_RATE: 100, // 100 VST per HBAR
  K_LINEAR: 0.0001, // Linear coefficient for price increase
  MIN_PURCHASE: 1, // Minimum 1 VST
  MAX_PURCHASE: 10000, // Maximum 10,000 VST
};

function calculatePrice(tokensSold) {
  const initialPricePerVst = CONFIG.INITIAL_PRICE_HBAR / CONFIG.INITIAL_EXCHANGE_RATE;
  const pricePerVst = initialPricePerVst * (1 + CONFIG.K_LINEAR * tokensSold);
  return pricePerVst;
}

function calculateBuyCost(tokensToBuy) {
  if (tokensToBuy < CONFIG.MIN_PURCHASE || tokensToBuy > CONFIG.MAX_PURCHASE) {
    throw new Error(`Purchase amount must be between ${CONFIG.MIN_PURCHASE} and ${CONFIG.MAX_PURCHASE} VST`);
  }

  const initialPricePerVst = CONFIG.INITIAL_PRICE_HBAR / CONFIG.INITIAL_EXCHANGE_RATE;

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
  const initialPrice = CONFIG.INITIAL_PRICE_HBAR / CONFIG.INITIAL_EXCHANGE_RATE;
  const priceImpact = ((currentPrice - initialPrice) / initialPrice) * 100;

  return {
    currentPrice,
    averagePrice,
    tokensToBuy,
    totalCost,
    priceImpact,
  };
}

console.log('🔍 Bonding Curve Algorithm Test');
console.log('================================');

// Test 1: Initial status
const initialPrice = CONFIG.INITIAL_PRICE_HBAR / CONFIG.INITIAL_EXCHANGE_RATE;
console.log('📊 Initial Status:');
console.log('  Initial Price:', initialPrice, 'HBAR per VST');
console.log('  Current Price:', calculatePrice(0), 'HBAR per VST');
console.log('  Exchange Rate:', CONFIG.INITIAL_EXCHANGE_RATE, 'VST per HBAR');
console.log('  Linear K:', CONFIG.K_LINEAR);
console.log('');

// Test 2: Buy 100 VST
console.log('🛍️ Buy 100 VST:');
const buy100 = calculateBuyCost(100);
console.log('  Current Price:', buy100.currentPrice.toFixed(8), 'HBAR per VST');
console.log('  Average Price:', buy100.averagePrice.toFixed(8), 'HBAR per VST');
console.log('  Total Cost:', buy100.totalCost.toFixed(8), 'HBAR');
console.log('  Price Impact:', buy100.priceImpact.toFixed(2), '%');
console.log('');

// Test 3: Buy 1000 VST
console.log('🛍️ Buy 1000 VST:');
const buy1000 = calculateBuyCost(1000);
console.log('  Current Price:', buy1000.currentPrice.toFixed(8), 'HBAR per VST');
console.log('  Average Price:', buy1000.averagePrice.toFixed(8), 'HBAR per VST');
console.log('  Total Cost:', buy1000.totalCost.toFixed(8), 'HBAR');
console.log('  Price Impact:', buy1000.priceImpact.toFixed(2), '%');
console.log('');

// Test 4: Price progression
console.log('📈 Price Progression:');
for (let i = 0; i <= 5; i++) {
  const tokens = i * 1000;
  const price = calculatePrice(tokens);
  console.log('  At', tokens, 'tokens sold: price =', price.toFixed(8), 'HBAR per VST');
}

// Test 5: Verify linear relationship
console.log('');
console.log('🔍 Linear Relationship Verification:');
const price0 = calculatePrice(0);
const price1000 = calculatePrice(1000);
const price2000 = calculatePrice(2000);
console.log('  Price at 0 tokens:', price0.toFixed(8), 'HBAR per VST');
console.log('  Price at 1000 tokens:', price1000.toFixed(8), 'HBAR per VST');
console.log('  Price at 2000 tokens:', price2000.toFixed(8), 'HBAR per VST');
console.log('  Difference (1000->2000):', (price2000 - price1000).toFixed(8), 'HBAR per VST');
console.log('  Expected difference:', (CONFIG.K_LINEAR * 1000 * initialPrice).toFixed(8), 'HBAR per VST');
