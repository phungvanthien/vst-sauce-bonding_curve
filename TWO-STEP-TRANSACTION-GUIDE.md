# Two-Step Transaction Implementation Guide

## Overview

The INVALID_SIGNATURE error was caused by attempting a multi-signature transaction where only one party could sign. The solution splits the transaction into two steps:

- **Step 1**: User signs HBAR transfer (works immediately)
- **Step 2**: Backend signs VST transfer (completes within 5-10 seconds)

## How It Works

### Buy Transaction Flow

```
Frontend (Step 1):
1. User enters amount and clicks "Buy"
2. Create HBAR-only TransferTransaction
3. Call manager.executeTransaction()
4. HashPack opens for user approval
5. User clicks "Approve"
6. HBAR transferred: Buyer → Treasury ✓
7. Toast: "Step 1 Complete! VST will arrive in 5-10 seconds"
8. Return transaction ID

Backend (Step 2):
1. Monitor blockchain for HBAR transfer
2. Verify HBAR arrived in treasury
3. Create VST TransferTransaction
4. Sign with treasury private key
5. Execute VST transfer: Treasury → Buyer
6. VST received by buyer ✓
```

### Sell Transaction Flow

```
Frontend (Step 1):
1. User enters amount and clicks "Sell"
2. Create VST-only TransferTransaction
3. Call manager.executeTransaction()
4. HashPack opens for user approval
5. User clicks "Approve"
6. VST transferred: Seller → Treasury ✓ (Burned)
7. Toast: "Step 1 Complete! HBAR will arrive in 5-10 seconds"
8. Return transaction ID

Backend (Step 2):
1. Monitor blockchain for VST transfer
2. Verify VST arrived in treasury
3. Create HBAR TransferTransaction
4. Sign with treasury private key
5. Execute HBAR transfer: Treasury → Seller
6. HBAR received by seller ✓
```

## Frontend Implementation

### Updated Functions

#### executeBuyTrade()

```typescript
export async function executeBuyTrade(params: BuyTradeParams): Promise<string> {
  // Step 1: Create HBAR-only transfer
  const hbarOnlyTx = new TransferTransaction()
    .addHbarTransfer(buyerAccountId, new Hbar(-hbarCost))
    .addHbarTransfer(treasuryAccountId, new Hbar(hbarCost))
  
  // Execute (only user signs)
  const response = await manager.executeTransaction(hbarOnlyTx, buyerAccountId)
  
  // Return transaction ID
  return extractTxId(response)
}
```

#### executeSellTrade()

```typescript
export async function executeSellTrade(params: SellTradeParams): Promise<string> {
  // Step 1: Create VST-only transfer
  const vstOnlyTx = new TransferTransaction()
    .addTokenTransfer(vstTokenId, sellerAccountId, -vstAmount)
    .addTokenTransfer(vstTokenId, treasuryAccountId, vstAmount)
  
  // Execute (only user signs)
  const response = await manager.executeTransaction(vstOnlyTx, sellerAccountId)
  
  // Return transaction ID
  return extractTxId(response)
}
```

### UI Messages

**Buy Success**:
```
Title: "Step 1 Complete!"
Message: "HBAR sent to treasury! ✓ VST will arrive in 5-10 seconds. TX: 0.0.xxx..."
```

**Sell Success**:
```
Title: "Step 1 Complete!"
Message: "VST burned! ✓ HBAR will arrive in 5-10 seconds. TX: 0.0.xxx..."
```

## Backend Implementation

### API Endpoint - Handle Buy Request

```python
@app.post('/api/bonding-curve/process-buy')
async def process_buy_request(request: BuyRequest):
    """
    Called after user successfully sends HBAR to treasury.
    Backend verifies HBAR transfer, then sends VST tokens.
    """
    try:
        # 1. Verify HBAR transfer
        tx_id = request.hbar_tx_id
        buyer_account = request.buyer_account_id
        vst_amount = request.vst_amount
        
        # Check if transaction succeeded
        receipt = verify_transaction(tx_id, client)
        if not receipt or receipt.status != "SUCCESS":
            return {"status": "error", "message": "HBAR transfer verification failed"}
        
        # 2. Verify HBAR arrived in treasury
        treasury = Account.fromString(TREASURY_ACCOUNT_ID)
        if treasury.balance < vst_amount:
            return {"status": "error", "message": "Treasury insufficient balance"}
        
        # 3. Create VST transfer transaction
        vst_transfer = TokenTransferTransaction(
            token_id=TokenId.fromString(VST_TOKEN_ID),
            account_id=AccountId.fromString(treasury),
            amount=-vst_amount,
        )
        vst_transfer.add_token_transfer(
            token_id=TokenId.fromString(VST_TOKEN_ID),
            account_id=AccountId.fromString(buyer_account),
            amount=vst_amount,
        )
        
        # 4. Sign with treasury private key
        treasury_key = PrivateKey.fromString(TREASURY_PRIVATE_KEY)
        signed_tx = vst_transfer.sign(treasury_key)
        
        # 5. Execute transaction
        response = client.execute_transaction(signed_tx)
        vst_tx_id = response.transaction_id.to_string()
        
        # 6. Return result
        return {
            "status": "success",
            "hbar_tx_id": tx_id,
            "vst_tx_id": vst_tx_id,
            "message": "VST transferred successfully"
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
```

### API Endpoint - Handle Sell Request

```python
@app.post('/api/bonding-curve/process-sell')
async def process_sell_request(request: SellRequest):
    """
    Called after user successfully sends VST to treasury.
    Backend verifies VST transfer, then sends HBAR tokens.
    """
    try:
        # 1. Verify VST transfer
        tx_id = request.vst_tx_id
        seller_account = request.seller_account_id
        hbar_proceeds = request.hbar_proceeds
        
        # Check if transaction succeeded
        receipt = verify_transaction(tx_id, client)
        if not receipt or receipt.status != "SUCCESS":
            return {"status": "error", "message": "VST transfer verification failed"}
        
        # 2. Verify VST arrived in treasury
        treasury = Account.fromString(TREASURY_ACCOUNT_ID)
        # (Check VST balance via mirror node or account data)
        
        # 3. Create HBAR transfer transaction
        hbar_transfer = TransferTransaction(
            hbar_transfers=[
                (AccountId.fromString(TREASURY_ACCOUNT_ID), -Hbar(hbar_proceeds)),
                (AccountId.fromString(seller_account), Hbar(hbar_proceeds)),
            ]
        )
        
        # 4. Sign with treasury private key
        treasury_key = PrivateKey.fromString(TREASURY_PRIVATE_KEY)
        signed_tx = hbar_transfer.sign(treasury_key)
        
        # 5. Execute transaction
        response = client.execute_transaction(signed_tx)
        hbar_tx_id = response.transaction_id.to_string()
        
        # 6. Return result
        return {
            "status": "success",
            "vst_tx_id": tx_id,
            "hbar_tx_id": hbar_tx_id,
            "message": "HBAR transferred successfully"
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
```

## Timeline

### Frontend (Already Complete)
- ✅ Split transactions into two steps
- ✅ Updated console logging
- ✅ Updated UI messages
- ✅ Ready for testing

### Backend (To Implement)
- ⏳ Create API endpoints
- ⏳ Monitor blockchain transactions
- ⏳ Verify transfers
- ⏳ Sign and execute secondary transfers

## Testing Checklist

### Manual Testing

```
1. ✓ Open http://localhost:5173/bonding-curve
2. ✓ Connect HashPack wallet
3. ✓ Have ~2 HBAR balance
4. ✓ Have VST token associated
5. ✓ Enter amount: 100 VST
6. ✓ Click "Buy VST"
7. ✓ Approve in HashPack
8. ✓ See "Step 1 Complete!" toast
9. ✓ Console shows "STEP 1 COMPLETE: HBAR transferred"
10. ⏳ Wait 5-10 seconds
11. ⏳ VST appears in wallet (after backend processes Step 2)
```

### Automated Testing

```
Test Cases:
- Buy with sufficient balance
- Buy with insufficient balance
- Buy with unassociated token
- Sell with sufficient VST balance
- Sell with insufficient VST balance
- Transaction rejection in HashPack
- Network timeout handling
```

## Error Handling

### Common Errors

1. **"INSUFFICIENT_ACCOUNT_BALANCE"**
   - User doesn't have enough HBAR
   - Solution: Ensure at least 2 HBAR (1 for transfer + 1 for fees)

2. **"TOKEN_NOT_ASSOCIATED"**
   - VST token not associated with account
   - Solution: Click "Associate Token" button first

3. **"USER_REJECTED"**
   - User clicked "Reject" in HashPack
   - Solution: Try again and click "Approve"

4. **Backend Step 2 Failure**
   - HBAR transfer succeeded, but VST transfer failed
   - Solution: Manual investigation via transaction explorer

## Monitoring

### Track Transactions

```python
def monitor_pending_transfers():
    """
    Periodically check for pending transfers and process them.
    """
    pending = get_pending_buys()  # From database
    
    for pending_buy in pending:
        try:
            # Verify HBAR arrived
            if verify_transaction(pending_buy['hbar_tx_id']):
                # Process VST transfer
                process_buy_request(pending_buy)
        except Exception as e:
            log_error(f"Failed to process buy: {e}")
```

## Future Improvements

### Option 1: Token Operator (Recommended)
Configure Treasury as operator:
```bash
# Treasury becomes operator for VST token
# Treasury can transfer on behalf of users
# Revert to single transaction
# Better UX
```

### Option 2: Smart Contract
Deploy Hedera smart contract:
```solidity
// Single transaction
// No multi-sig issues
// Fully trustless
// Production-ready
```

## Support & Debugging

### Console Logs to Check

```javascript
// Step 1 logging
🛍️ Starting buy transaction (Step 1: HBAR transfer)...
📝 Creating HBAR-only transfer transaction...
✅ HBAR-only transaction created
📤 Sending to HashPack for user signature...
✅ Transaction response received
✅ STEP 1 COMPLETE: HBAR transferred to treasury
⏳ STEP 2: Backend will send X VST tokens to buyer...
```

### Transaction Explorer

Check transactions on Hedera Explorer:
```
https://mainnet.mirrornode.hedera.com/explorer/transaction/0.0.xxx@time
```

### Debug Commands

```javascript
// Verify HBAR transfer
fetch('https://mainnet.mirrornode.hedera.com/api/v1/transactions/0.0.123@456')
  .then(r => r.json())
  .then(d => console.log(d))

// Check account balance
fetch('https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398')
  .then(r => r.json())
  .then(d => console.log('Treasury HBAR:', d.balance))

// Check token balance
fetch('https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398/tokens')
  .then(r => r.json())
  .then(d => console.log('Tokens:', d.tokens))
```

