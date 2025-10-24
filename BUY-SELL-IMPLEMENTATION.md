# Buy/Sell Transaction Implementation

## Overview

The bonding curve now supports real buy and sell transactions on the Hedera blockchain. When users click buy or sell, actual HBAR and VST token transfers occur between their wallet and the treasury account.

## Transaction Flow

### Buy Transaction

```
User clicks "Buy VST"
        ↓
Validate wallet connected + HashPack + manager
        ↓
Get pricing data (amount & HBAR cost)
        ↓
Create TransferTransaction with:
  • HBAR: Buyer → Treasury
  • VST: Treasury → Buyer
        ↓
Call manager.executeTransaction()
        ↓
HashPack dialog opens for approval
        ↓
User clicks "Approve"
        ↓
Transaction submitted to blockchain
        ↓
Success/Error response
        ↓
Show toast notification
        ↓
Reset form
```

### Sell Transaction

```
User clicks "Sell VST"
        ↓
Validate wallet connected + HashPack + manager
        ↓
Get pricing data (amount & HBAR proceeds)
        ↓
Create TransferTransaction with:
  • VST: Seller → Treasury (BURN)
  • HBAR: Treasury → Seller
        ↓
Call manager.executeTransaction()
        ↓
HashPack dialog opens for approval
        ↓
User clicks "Approve"
        ↓
Transaction submitted to blockchain
        ↓
Success/Error response
        ↓
Show toast notification
        ↓
Reset form
```

## Code Structure

### BondingCurveTradeService

**Location**: `src/services/bondingCurveTradeService.ts`

**Functions**:

1. `executeBuyTrade(params: BuyTradeParams): Promise<string>`
   - Executes a buy transaction
   - Parameters:
     - `buyerAccountId`: User's Hedera account
     - `vstAmount`: Amount of VST in raw units (×10^8)
     - `hbarCost`: HBAR cost from pricing calculation
     - `treasuryAccountId`: Treasury account (0.0.9451398)
     - `vstTokenId`: VST token ID (0.0.10048687)
     - `manager`: HashConnect manager instance
   - Returns: Transaction ID string

2. `executeSellTrade(params: SellTradeParams): Promise<string>`
   - Executes a sell transaction
   - Parameters:
     - `sellerAccountId`: User's Hedera account
     - `vstAmount`: Amount of VST in raw units (×10^8)
     - `hbarProceeds`: HBAR proceeds from pricing calculation
     - `treasuryAccountId`: Treasury account
     - `vstTokenId`: VST token ID
     - `manager`: HashConnect manager instance
   - Returns: Transaction ID string

3. `getTradeErrorMessage(error: any): string`
   - Converts error objects to user-friendly messages

### BondingCurve Component

**Location**: `src/components/BondingCurve.tsx`

**Function**: `handleTrade()`

**Flow**:
1. Validates wallet (connected, HashPack, manager exists)
2. Gets pricing/selling data from state
3. Gets treasury account ID from environment
4. Converts VST amount to raw units (× 100000000 for 8 decimals)
5. Calls appropriate trade function
6. Shows success/error toast
7. Resets form

## Transaction Details

### Buy Transaction Structure

```typescript
const transferTx = new TransferTransaction()
  // Transfer HBAR to treasury
  .addHbarTransfer(buyerAccountId, new Hbar(-hbarCost))
  .addHbarTransfer(treasuryAccountId, new Hbar(hbarCost))
  // Transfer VST to buyer
  .addTokenTransfer(vstTokenId, treasuryAccountId, -vstAmount)
  .addTokenTransfer(vstTokenId, buyerAccountId, vstAmount);

// Execute via HashConnect
const response = await manager.executeTransaction(
  transferTx,
  buyerAccountId
);
```

### Sell Transaction Structure

```typescript
const transferTx = new TransferTransaction()
  // Burn VST from seller (transfer to treasury)
  .addTokenTransfer(vstTokenId, sellerAccountId, -vstAmount)
  .addTokenTransfer(vstTokenId, treasuryAccountId, vstAmount)
  // Transfer HBAR to seller
  .addHbarTransfer(treasuryAccountId, new Hbar(-hbarProceeds))
  .addHbarTransfer(sellerAccountId, new Hbar(hbarProceeds));

// Execute via HashConnect
const response = await manager.executeTransaction(
  transferTx,
  sellerAccountId
);
```

## Amount Conversion

VST token has 8 decimal places.

**Display to Raw Conversion**:
```
displayAmount = 100 VST
rawAmount = 100 × 10^8 = 10,000,000,000 units
```

**Raw to Display Conversion**:
```
rawAmount = 10,000,000,000 units
displayAmount = 10,000,000,000 ÷ 10^8 = 100 VST
```

## Environment Variables

```env
VITE_VST_TOKEN_ID=0.0.10048687          # VST token ID
VITE_TREASURY_ID=0.0.9451398            # Treasury account
VITE_MIRROR_NODE_URL=https://...        # Mirror Node endpoint
```

## Error Handling

### Common Errors

1. **Insufficient HBAR Balance**
   - User doesn't have enough HBAR to pay for the transaction
   - Solution: Add more HBAR to wallet

2. **Token Not Associated**
   - Account hasn't associated VST token yet
   - Solution: Click "Associate Token" button first

3. **Transaction Rejected**
   - User clicked "Reject" in HashPack
   - Solution: Retry and click "Approve"

4. **Invalid Transaction**
   - Transaction structure is invalid
   - Solution: Check parameters and balance

5. **Network Error**
   - Network connectivity issue
   - Solution: Check connection and retry

### Error Messages

User-friendly error messages are provided for common scenarios:

```typescript
export function getTradeErrorMessage(error: any): string {
  if (errorStr.includes("INSUFFICIENT_ACCOUNT_BALANCE")) {
    return "Insufficient HBAR balance for this transaction";
  }
  if (errorStr.includes("TOKEN_NOT_ASSOCIATED")) {
    return "Token not associated with account. Please associate first.";
  }
  if (errorStr.includes("USER_REJECTED")) {
    return "Transaction rejected in your wallet";
  }
  // ... more error cases ...
}
```

## Console Logging

### Buy Transaction Log Example

```
🛍️ Starting buy transaction...
   VST Amount: 100
   HBAR Cost: 1.005
   Buyer: 0.0.1234567
   Treasury: 0.0.9451398
✅ Transfer transaction created
📤 Sending to HashPack for signing...
✅ Transaction response received
✅ Buy completed!
   HBAR transferred: 1.005 to treasury
   VST transferred: 10000000000 to buyer
   Transaction ID: 0.0.1234567-12345-67890
```

### Sell Transaction Log Example

```
💵 Starting sell transaction...
   VST Amount: 50
   HBAR Proceeds: 0.50
   Seller: 0.0.1234567
   Treasury: 0.0.9451398
✅ Transfer transaction created
📤 Sending to HashPack for signing...
✅ Transaction response received
✅ Sell completed!
   VST burned: 50
   HBAR transferred: 0.50 to seller
   Transaction ID: 0.0.1234567-12345-67890
```

## Account Balances

### After Buy (100 VST)

| Account | Before | Change | After |
|---------|--------|--------|-------|
| User HBAR | 10.00 | -1.005 | 8.995 |
| Treasury HBAR | 0.00 | +1.005 | 1.005 |
| User VST | 0 | +100 | 100 |
| Treasury VST | 100000 | -100 | 99900 |

### After Sell (50 VST)

| Account | Before | Change | After |
|---------|--------|--------|-------|
| User VST | 100 | -50 | 50 |
| Treasury VST | 99900 | +50 | 99950 |
| User HBAR | 8.995 | +0.50 | 9.495 |
| Treasury HBAR | 1.005 | -0.50 | 0.505 |

## Testing Guide

### Prerequisites

1. Connect HashPack wallet
2. Associate VST token (if not already associated)
3. Have sufficient HBAR for transaction fees
4. Treasury account must have VST tokens

### Test Buy

```
1. Open http://localhost:5173/bonding-curve
2. Open DevTools Console (F12)
3. Enter amount (e.g., 100)
4. Click "Buy VST" button
5. Check console logs
6. HashPack dialog opens
7. Click "Approve"
8. Verify transaction ID in console
9. Check toast notification for success/error
```

### Test Sell

```
1. Switch to "Sell" mode (click swap icon)
2. Enter amount (e.g., 50)
3. Click "Sell VST" button
4. Check console logs
5. HashPack dialog opens
6. Click "Approve"
7. Verify transaction ID in console
8. Check toast notification for success/error
```

## Implementation Details

### HashConnect Integration

Uses `manager.executeTransaction()` method which:
1. Creates the transaction
2. Opens HashPack for user approval
3. Signs the transaction with user's private key
4. Submits to blockchain network
5. Returns transaction ID

### Response Parsing

The service extracts transaction ID from various response formats:

```typescript
let txId = response;
if (typeof response === 'object' && response.transactionId) {
  txId = response.transactionId;
}
if (typeof response === 'object' && response.response && response.response.transactionId) {
  txId = response.response.transactionId;
}
```

## Performance Notes

- **Transaction creation**: ~100ms
- **User approval in HashPack**: User dependent (typically 5-10 seconds)
- **Blockchain submission**: ~2-5 seconds
- **Total time**: ~10-20 seconds from click to confirmation

## Future Enhancements

1. Add transaction history tracking
2. Add real-time balance updates
3. Add transaction rate limiting
4. Add slippage protection
5. Add gas fee estimation UI
6. Add transaction receipts page

