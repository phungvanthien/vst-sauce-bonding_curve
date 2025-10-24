# INVALID_SIGNATURE Error - Root Cause & Solution

## Problem Analysis

The INVALID_SIGNATURE error occurs because the current transaction structure requires **multi-signature authorization**, but HashConnect can only sign with the user's (buyer's) account.

### Transaction Structure (Current - BROKEN)

```
TransferTransaction {
  Transfer 1: HBAR from Buyer → Treasury
  Transfer 2: VST from Treasury → Buyer
}

Requires Signatures:
  ✓ Buyer signature (for sending HBAR)
  ✗ Treasury signature (for sending VST) - NOT AVAILABLE!
```

**Problem**: Treasury account must sign to authorize sending its tokens, but we can only sign with the buyer's wallet through HashConnect.

## Root Causes

### 1. Multi-Signature Requirement
- Hedera requires that the account losing assets must sign the transaction
- Buyer sends HBAR → Buyer must sign ✓
- Treasury sends VST → **Treasury must sign** ✗
- Only one account can be signed with HashConnect

### 2. Treasury Account Authority
- Treasury account doesn't have pre-authorization to send tokens
- No operator permissions configured
- No pre-signed transactions available

### 3. Transaction Authority Rules
- Hedera validates that every account losing assets has signed
- If treasury hasn't signed, transaction fails with INVALID_SIGNATURE
- This is a security feature to prevent unauthorized token transfers

## Solutions

### Solution 1: Use Treasury Operator (RECOMMENDED - QUICK FIX)

Configure the VST token to give Treasury operator permissions:

```bash
# Make Treasury an OPERATOR for VST token
# This allows Treasury to transfer VST on behalf of others
# User still signs the transaction
```

**Pros:**
- Single transaction
- User signs once
- Fast implementation

**Cons:**
- Requires token configuration change
- Treasury has broad permissions

### Solution 2: Two-Step Transaction (WORKAROUND)

Split into two separate transactions:

```
Step 1: User → Treasury (HBAR only)
  • Only user signs
  • Treasury receives HBAR
  • Succeeds immediately

Step 2: Treasury → User (VST only)
  • Backend/admin signs for treasury
  • User receives VST
  • Can be done via backend API
```

**Pros:**
- Works with current setup
- No token configuration needed
- Can be implemented quickly

**Cons:**
- Two separate transactions
- User doesn't get VST immediately
- Requires backend involvement

### Solution 3: Smart Contract (BEST PRACTICE - RECOMMENDED FOR PRODUCTION)

Deploy a Hedera smart contract to handle bonding curve logic:

```solidity
// Pseudo-code
contract BondingCurve {
  function buyVST(uint amount) external payable {
    // User sends HBAR to contract
    require(msg.value >= calculatedCost);
    
    // Contract sends VST to user
    VST.transfer(msg.sender, amount);
    
    // Contract sends HBAR to treasury
    treasury.transfer(msg.value);
  }
  
  function sellVST(uint amount) external {
    // User sends VST to contract
    VST.transferFrom(msg.sender, address(this), amount);
    
    // Contract sends HBAR to user
    msg.sender.transfer(calculatedProceeds);
    
    // VST is burned
    VST.burn(amount);
  }
}
```

**Pros:**
- Fully trustless
- Single transaction per action
- Best user experience
- Production-ready

**Cons:**
- Requires smart contract deployment
- More complex implementation
- Gas fees for contract execution

### Solution 4: Pre-Signed Transactions (ADVANCED)

Treasury pre-signs transactions and stores them:

```
Setup Phase:
  1. Treasury generates transaction templates
  2. Treasury signs with private key
  3. Store signed transactions in database
  
Usage Phase:
  1. User clicks buy/sell
  2. Retrieve pre-signed transaction from database
  3. Add user's data
  4. User signs
  5. Transaction has both signatures
```

**Pros:**
- Complete control
- Works immediately

**Cons:**
- Complex implementation
- Requires secure key management
- Database management

## Recommended Implementation Path

### Phase 1 (Immediate - 1 day)
Implement Solution 2 (Two-Step Transaction):

```typescript
// Frontend
async function buyVST(amount, hbarCost) {
  // Step 1: Send HBAR to treasury
  const hbarTx = await buyerSend HBAR to treasury
  const txId = await executeTransaction(hbarTx)
  
  // Notify user: "HBAR sent, waiting for VST..."
  
  // Step 2: Backend handles VST transfer
  // (User gets VST after ~5-10 seconds)
}
```

**Benefits:**
- Works immediately
- No configuration changes needed
- User sees HBAR transfer confirmation
- Clear feedback loop

### Phase 2 (Short-term - 1 week)
Implement Solution 1 (Token Operator):

```bash
# Configure VST token
# Make Treasury an OPERATOR
# Treasury can transfer VST on behalf of users
```

**Benefits:**
- Single transaction
- Better UX
- Still user-signed

### Phase 3 (Long-term - Production)
Implement Solution 3 (Smart Contract):

```solidity
// Deploy Hedera smart contract
// Handles all bonding curve logic
// Fully trustless and transparent
```

## Quick Verification Steps

### Check Treasury Balance
```javascript
// Run in DevTools Console
fetch('https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398')
  .then(r => r.json())
  .then(d => console.log('Treasury balance:', d.balance, 'HBAR'))
```

### Check Treasury Token Association
```javascript
fetch('https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398/tokens')
  .then(r => r.json())
  .then(d => {
    const vst = d.tokens?.find(t => t.token_id === '0.0.10048687')
    console.log('VST Association:', vst)
  })
```

### Check Token Configuration
```javascript
fetch('https://mainnet.mirrornode.hedera.com/api/v1/tokens/0.0.10048687')
  .then(r => r.json())
  .then(d => console.log('Token info:', d))
```

## Implementation for Solution 2 (Two-Step)

### Updated Buy Flow

```typescript
// src/services/bondingCurveTradeService.ts

export async function executeBuyTrade(params: BuyTradeParams): Promise<string> {
  try {
    // STEP 1: User sends HBAR to Treasury
    console.log('📤 Step 1: Sending HBAR to Treasury...')
    const hbarOnlyTx = new TransferTransaction()
      .addHbarTransfer(buyerAccountId, new Hbar(-hbarCost))
      .addHbarTransfer(treasuryAccountId, new Hbar(hbarCost))
    
    const response = await manager.executeTransaction(hbarOnlyTx, buyerAccountId)
    const txId = extractTxId(response)
    
    console.log('✅ HBAR transferred:', txId)
    
    // STEP 2: Backend sends VST (async)
    console.log('⏳ Step 2: Requesting VST from treasury...')
    await notifyBackendOfBuyRequest({
      buyerAccountId,
      vstAmount,
      txId
    })
    
    console.log('✅ Buy initiated! VST will arrive in 5-10 seconds.')
    return txId
    
  } catch (error) {
    console.error('❌ Buy failed:', error)
    throw error
  }
}
```

### Backend Endpoint (Example)

```python
# Backend API
@app.post('/api/bonding-curve/vst-transfer')
async def send_vst(buyerAccountId, vstAmount, buyTxId):
    """
    Triggered after user successfully sends HBAR to treasury.
    Backend verifies HBAR transfer, then sends VST tokens.
    """
    
    # Verify HBAR transfer
    receipt = verify_transaction(buyTxId)
    if not receipt or receipt.status != SUCCESS:
        return error("HBAR transfer not verified")
    
    # Sign VST transfer with treasury private key
    vst_tx = create_token_transfer(
        from_account=treasury,
        to_account=buyerAccountId,
        token_id=VST_TOKEN_ID,
        amount=vstAmount
    )
    
    # Execute transaction
    response = client.executeTransaction(vst_tx)
    
    return {
        status: "success",
        tx_id: response.transactionId,
        message: "VST transferred successfully"
    }
```

## Current Implementation Status

### What's Working
- ✓ Transaction structure creation
- ✓ HashConnect integration
- ✓ Error handling
- ✓ Logging and debugging

### What Needs Fixing
- ✗ Multi-signature authorization
- ✗ Treasury account signing
- ✗ Transaction validation on-chain

### Next Actions
1. Choose preferred solution (recommend Solution 2 for quick fix)
2. Implement accordingly
3. Test with real transactions
4. Monitor for INVALID_SIGNATURE errors
5. Scale to production once verified

## Support References

- Hedera Documentation: https://docs.hedera.com/
- HashConnect Guide: https://www.hashconnect.org/
- Mirror Node API: https://docs.hedera.com/guides/apis/the-json-rpc-api
- Smart Contracts: https://docs.hedera.com/guides/smart-contracts/

