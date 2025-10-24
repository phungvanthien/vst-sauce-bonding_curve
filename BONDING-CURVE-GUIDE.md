# VST Bonding Curve Trading - Complete Guide

## 🎯 Overview

The VST Bonding Curve is a dynamic pricing mechanism for VST tokens on Hedera Mainnet that implements a linear bonding curve model. This guide covers the feature, mathematics, and integration details.

---

## 📊 Bonding Curve Specifications

### Token Information
- **Token ID**: `0.0.10048687`
- **Token Name**: Vistia Token
- **Token Symbol**: VST
- **Network**: Hedera Mainnet
- **Total Supply**: 100,000 VST (Fixed)
- **Decimals**: 8

### Pricing Model
- **Type**: Linear Bonding Curve
- **Initial Price**: 1 HBAR = 100 VST
- **Price Formula**: `Price = P₀ × (1 + K × n)`
- **Cost Formula**: `Cost = P₀×n + (P₀×K×n²)/2`
- **Linear Coefficient (K)**: 0.0001

Where:
- `P₀` = Initial price (0.01 HBAR per VST)
- `n` = Number of tokens traded
- `K` = Linear coefficient determining price increase rate

### Trading Limits
- **Minimum Transaction**: 1 VST
- **Maximum Transaction**: 10,000 VST
- **Minimum Purchase**: 1 HBAR (100 VST at initial price)
- **Maximum Purchase**: 100 HBAR (at current price)

---

## 💰 Mechanics

### Buy Mechanism
1. **User Action**: User specifies VST amount to buy
2. **Calculation**: System calculates required HBAR using bonding curve formula
3. **Price Impact**: Price increases linearly as more tokens are purchased
4. **Transfer**: HBAR transferred from buyer's wallet to treasury
5. **Delivery**: VST tokens transferred from treasury to buyer's wallet

```
Buyer Wallet: -X HBAR
↓
Treasury: +X HBAR
↓
VST Tokens Released: Y VST to Buyer
```

### Sell Mechanism
1. **User Action**: User specifies VST amount to sell
2. **Calculation**: System calculates HBAR proceeds using bonding curve formula
3. **Price Impact**: Price decreases as tokens are removed from circulation
4. **Burn**: VST tokens are burned (removed from supply)
5. **Payment**: HBAR transferred from treasury to seller's wallet

```
Seller Wallet: +X HBAR
↑
Treasury: -X HBAR
↓
VST Tokens: Y VST burned
```

---

## 📐 Mathematical Details

### Buy Price Calculation
For purchasing `n` VST tokens:

```
Total Cost (in HBAR) = P₀ × n + (P₀ × K × n²) / 2
Average Price = Total Cost / n
Current Price at n = P₀ × (1 + K × n)
```

**Example**: Buying 100 VST
- Initial price: 0.01 HBAR/VST
- Total cost: (0.01 × 100) + (0.01 × 0.0001 × 100²) / 2 = 1.05 HBAR
- Average price: 1.05 / 100 = 0.0105 HBAR/VST
- Final price: 0.01 × (1 + 0.0001 × 100) = 0.0101 HBAR/VST
- Price impact: ((0.0101 - 0.01) / 0.01) × 100 = 1%

### Sell Price Calculation
For selling `n` VST tokens:

```
Total Proceeds (in HBAR) = P₀ × n + (P₀ × K × n²) / 2
```

Same formula as buying, which ensures symmetric liquidity.

---

## 🔗 Smart Contract Integration

### Environment Variables
```env
VITE_VST_TOKEN_ID=0.0.10048687
VITE_TOKEN_ADDRESS=0x00000000000000000000000000000000009954af
VITE_TREASURY_ID=0.0.9451398
VITE_HEDERA_ACCOUNT_ID=0.0.9451398
```

### Files Structure
```
src/
├── components/
│   └── BondingCurve.tsx              # Main UI component
├── pages/
│   └── BondingCurve.tsx              # Page wrapper
├── services/
│   └── bondingCurveService.ts        # Business logic & calculations
└── App.tsx                           # Route configuration
```

---

## 🎨 UI Features

### Components

#### 1. Price Display
- Current price per VST
- Initial exchange rate (1 HBAR = 100 VST)
- Max purchase limit

#### 2. Price Chart
- Real-time price curve visualization
- Historical price trends
- Cumulative cost/proceeds

#### 3. Trade Interface
- **Input Modes**: Buy VST / Sell VST
- **Amount Input**: Slider or direct input (1-10,000 VST)
- **Price Preview**:
  - Total cost/proceeds
  - Average price
  - Final price
  - Price impact percentage

#### 4. Information Panel
- How bonding curve works
- Mathematical formulas
- Transaction limits
- Current status

#### 5. Recent Trades
- Transaction history
- Trade details (coming soon)

---

## 🔧 API Reference

### Core Functions

#### `calculateBuyCost(tokensToBuy: number): PricingData`
Calculates the cost to purchase tokens.

**Parameters:**
- `tokensToBuy`: Number of VST to purchase (1-10,000)

**Returns:**
```typescript
{
  currentPrice: number;      // Final price (HBAR per VST)
  averagePrice: number;      // Average purchase price
  tokensToBuy: number;       // Tokens to purchase
  totalCost: number;         // Total HBAR required
  priceImpact: number;       // Price impact in percentage
}
```

**Example:**
```typescript
import { calculateBuyCost } from '@/services/bondingCurveService';

const data = calculateBuyCost(100);
console.log(data.totalCost);   // ≈ 1.05
console.log(data.priceImpact); // ≈ 1
```

#### `calculateSellProceeds(tokensToSell: number): SellData`
Calculates HBAR received from selling tokens.

**Parameters:**
- `tokensToSell`: Number of VST to sell (1-10,000)

**Returns:**
```typescript
{
  currentPrice: number;      // Final price (HBAR per VST)
  tokensToSell: number;      // Tokens to sell
  totalReceived: number;     // Total HBAR received
  priceImpact: number;       // Price impact in percentage
}
```

#### `getBondingCurveStatus(): Object`
Gets current bonding curve configuration.

**Returns:**
```typescript
{
  initialPrice: number;          // 0.01 HBAR
  currentPrice: number;          // Current price per VST
  initialExchangeRate: number;   // 100 VST per HBAR
  linearCoefficient: number;     // K = 0.0001
  minPurchase: number;           // 1 VST
  maxPurchase: number;           // 10,000 VST
  vstDecimals: number;           // 8
  hbarDecimals: number;          // 8
}
```

#### `getPriceHistory(maxTokens?: number, steps?: number): Array`
Generates price history for chart display.

**Returns:**
```typescript
[
  {
    tokens: number;        // Tokens at this point
    price: number;         // Price per token (HBAR)
    cumulative: number;    // Cumulative cost (HBAR)
  },
  // ...
]
```

#### `executeBuyTransaction(...): Promise<TransactionResult>`
Executes a buy transaction.

**Parameters:**
- `buyerAccountId`: Buyer's Hedera account ID
- `treasuryAccountId`: Treasury account ID
- `vstTokenId`: VST token ID
- `hbarAmount`: HBAR amount to transfer
- `vstAmount`: VST amount to receive
- `hbarAccountPrivateKey`: (Optional) Private key for signing

#### `executeSellTransaction(...): Promise<TransactionResult>`
Executes a sell transaction.

**Parameters:**
- `sellerAccountId`: Seller's Hedera account ID
- `treasuryAccountId`: Treasury account ID
- `vstTokenId`: VST token ID
- `vstAmount`: VST amount to sell
- `hbarAmount`: HBAR amount to receive
- `hbarAccountPrivateKey`: (Optional) Private key for signing

---

## 🚀 Usage Examples

### Example 1: Calculate Buy Cost
```typescript
import { calculateBuyCost, formatPrice } from '@/services/bondingCurveService';

// User wants to buy 250 VST
const pricing = calculateBuyCost(250);

console.log(`Total cost: ${formatPrice(pricing.totalCost)}`);
console.log(`Average price: ${formatPrice(pricing.averagePrice)}`);
console.log(`Price impact: ${pricing.priceImpact.toFixed(2)}%`);
```

### Example 2: Calculate Sell Proceeds
```typescript
import { calculateSellProceeds, formatPrice } from '@/services/bondingCurveService';

// User wants to sell 500 VST
const selling = calculateSellProceeds(500);

console.log(`Total received: ${formatPrice(selling.totalReceived)}`);
console.log(`Price impact: ${selling.priceImpact.toFixed(2)}%`);
```

### Example 3: Get Curve Status
```typescript
import { getBondingCurveStatus } from '@/services/bondingCurveService';

const status = getBondingCurveStatus();
console.log(`Current price: ${status.currentPrice} HBAR/VST`);
console.log(`Initial rate: 1 HBAR = ${status.initialExchangeRate} VST`);
```

### Example 4: React Component Integration
```typescript
import { useState, useEffect } from 'react';
import { calculateBuyCost, formatPrice } from '@/services/bondingCurveService';

function PriceCalculator() {
  const [amount, setAmount] = useState(100);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    try {
      const data = calculateBuyCost(amount);
      setPricing(data);
    } catch (error) {
      console.error('Invalid amount');
    }
  }, [amount]);

  if (!pricing) return <div>Invalid amount</div>;

  return (
    <div>
      <p>Amount: {amount} VST</p>
      <p>Cost: {formatPrice(pricing.totalCost)}</p>
      <p>Price Impact: {pricing.priceImpact.toFixed(2)}%</p>
    </div>
  );
}
```

---

## 🛡️ Error Handling

### Invalid Amounts
```typescript
try {
  calculateBuyCost(50000); // Exceeds max of 10,000
} catch (error) {
  console.error(error.message);
  // "Purchase amount must be between 1 and 10000 VST"
}
```

### Price Calculations
- Validates amount is within min/max range
- Calculates with precision to 8 decimals
- Returns price impact as percentage

---

## 📈 Price Curve Examples

### Sample Prices at Different Supply Levels

| VST Sold | Price/VST | Avg Price | Total Cost | Price Impact |
|----------|-----------|-----------|-----------|--------------|
| 0 | 0.0100 | - | - | - |
| 100 | 0.0101 | 0.0105 | 1.050 | 1.00% |
| 500 | 0.0105 | 0.0127 | 6.350 | 5.00% |
| 1,000 | 0.0110 | 0.0155 | 15.500 | 10.00% |
| 5,000 | 0.0150 | 0.0325 | 162.500 | 50.00% |
| 10,000 | 0.0200 | 0.0500 | 500.000 | 100.00% |

---

## ⚠️ Important Considerations

### For Users
1. **Price Impact**: Larger trades have higher price impact
2. **Slippage**: Be aware of price changes during transaction
3. **Fees**: Hedera transaction fees apply (~0.001 HBAR)
4. **Limits**: Cannot trade more than 10,000 VST per transaction

### For Developers
1. **Precision**: Always use 8 decimals for VST and HBAR
2. **Validation**: Check amount limits before calculations
3. **Errors**: Handle calculation errors gracefully
4. **UI**: Update prices in real-time as user changes input

### For Smart Contract
1. **Authorization**: Only treasury can initiate token transfers
2. **Burning**: On sell, VST tokens are burned
3. **Liquidity**: Treasury must have sufficient HBAR
4. **Atomicity**: Buy/sell transactions must be atomic

---

## 🔗 URLs & Links

### Access Bonding Curve
- **Frontend**: http://localhost:5173/bonding-curve

### View Token on Hedera
- **Token**: https://mainnet.mirrornode.hedera.com/api/v1/tokens/0.0.10048687
- **Treasury**: https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398

### Hedera Documentation
- **SDK Docs**: https://docs.hedera.com
- **Mirror Node**: https://mainnet.mirrornode.hedera.com

---

## 📞 Troubleshooting

### Issue: "Amount must be between 1 and 10000"
**Solution**: Ensure input is within valid range

### Issue: Prices not updating
**Solution**: Check if service is properly initialized, clear browser cache

### Issue: Transaction fails
**Solution**: 
- Verify account has sufficient HBAR
- Check network connection
- Ensure account is associated with token

---

## 🎓 Further Reading

- [Bonding Curve Theory](https://en.wikipedia.org/wiki/Bonding_curve)
- [Hedera Token Service](https://docs.hedera.com/guides/docs/sdks/tokens)
- [Dynamic Pricing Models](https://en.wikipedia.org/wiki/Dynamic_pricing)

---

**Last Updated**: October 23, 2025
**Status**: ✅ Production Ready

