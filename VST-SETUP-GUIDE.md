# VST Token Setup & Integration Guide

## Overview

This guide covers the VST (Vistia Token) that has been successfully minted on Hedera Mainnet with the following specifications:

- **Token ID**: `0.0.10048687`
- **Total Supply**: 100,000 VST
- **Decimals**: 8
- **Network**: Hedera Mainnet
- **Status**: ✅ Active & Ready

---

## Environment Configuration

### Update Your `.env` File

Add the following variables to your project's `.env` file:

```env
# Hedera Configuration
VITE_HEDERA_ACCOUNT_ID=0.0.9451398
VITE_TREASURY_ID=0.0.9451398
VITE_EVM_ADDRESS=0x539425c9d4a66a2ace88dea7533ac775df4e40e2
VITE_PRIVATE_KEY=d8fc50eb2ca055b1703bc9bc225889ffa29565b3e5ad63b6a384f2adba2daebb

# VST Token Configuration
VITE_VST_TOKEN_ID=0.0.10048687
VITE_VST_DECIMALS=8
VITE_VST_SYMBOL=VST
VITE_VST_NAME=Vistia Token

# Network
VITE_MIRROR_NODE_URL=https://mainnet.mirrornode.hedera.com/api/v1
VITE_HASHCONNECT_PROJECT_ID=demo-app-v1
```

---

## Available Tools & Scripts

### 1. Mint Script (`mint-vst-token.mjs`)

Creates the VST token on Hedera mainnet.

```bash
node mint-vst-token.mjs
```

**Output**: Token ID and initial mint of 100,000 VST to treasury

### 2. Verify Script (`verify-vst-token.mjs`)

Checks token information and treasury balance.

```bash
node verify-vst-token.mjs
```

**Output**: Token details, security configuration, treasury balance

### 3. Utility Library (`vst-token-utils.mjs`)

Provides helpful functions for token operations.

```javascript
import {
  formatVST,
  toRawVST,
  getVSTTokenId,
  formatBalance,
  VST_TOKEN,
  // ... other functions
} from './vst-token-utils.mjs'
```

---

## Usage Examples

### Example 1: Format Token Balance for Display

```javascript
import { formatBalance } from './vst-token-utils.mjs'

// Treasury has 100,000 VST (raw: 10000000000000)
const rawBalance = 10000000000000n
const displayBalance = formatBalance(rawBalance)

console.log(displayBalance) // "100000.00000000 VST"
```

### Example 2: Convert Display Amount to Raw Amount

```javascript
import { toRawVST } from './vst-token-utils.mjs'

// Convert 100 VST to raw amount for transactions
const displayAmount = 100
const rawAmount = toRawVST(displayAmount)

console.log(rawAmount) // 10000000000n
```

### Example 3: Get Token Information

```javascript
import { VST_TOKEN, getVSTInfo } from './vst-token-utils.mjs'

// Direct access to token constants
console.log(VST_TOKEN.ID)       // "0.0.10048687"
console.log(VST_TOKEN.SYMBOL)   // "VST"
console.log(VST_TOKEN.DECIMALS) // 8

// Or get complete info object
const info = getVSTInfo()
console.log(info)
// {
//   name: "Vistia Token",
//   symbol: "VST",
//   decimals: 8,
//   tokenId: "0.0.10048687",
//   maxSupply: 100000,
//   treasury: "0.0.9451398"
// }
```

### Example 4: Validate Token Amount

```javascript
import { isValidVSTAmount } from './vst-token-utils.mjs'

isValidVSTAmount(100)      // true
isValidVSTAmount(150000)   // false (exceeds max supply)
isValidVSTAmount(-50)      // false (negative)
isValidVSTAmount("50.5")   // true
```

### Example 5: Calculate Distribution

```javascript
import { calculateDistribution } from './vst-token-utils.mjs'

const recipients = [
  { address: "0.0.1000001", percentage: 40 },
  { address: "0.0.1000002", percentage: 30 },
  { address: "0.0.1000003", percentage: 30 },
]

const distribution = calculateDistribution(recipients)

distribution.forEach(item => {
  console.log(`${item.address}: ${item.displayAmount} VST (${item.percentage}%)`)
})
// Output:
// 0.0.1000001: 40000.00000000 VST (40%)
// 0.0.1000002: 30000.00000000 VST (30%)
// 0.0.1000003: 30000.00000000 VST (30%)
```

---

## Integration into React Components

### Example: Display Token Balance

```typescript
import { useEffect, useState } from 'react'
import { Client, AccountId, TokenInfoQuery } from '@hashgraph/sdk'
import { formatBalance, VST_TOKEN } from './vst-token-utils.mjs'

export function TokenBalance() {
  const [balance, setBalance] = useState<string>('0 VST')

  useEffect(() => {
    const fetchBalance = async () => {
      // Query from Hedera
      const client = Client.forMainnet()
      const accountInfo = await client
        .getAccountInfo(AccountId.fromString("0.0.9451398"))

      // Find VST token balance
      for (const [tokenId, tokenBalance] of accountInfo.tokenRelationships) {
        if (tokenId.toString() === VST_TOKEN.ID) {
          setBalance(formatBalance(tokenBalance.balance))
          break
        }
      }
    }

    fetchBalance()
  }, [])

  return (
    <div className="token-balance">
      <h3>VST Balance</h3>
      <p>{balance}</p>
    </div>
  )
}
```

### Example: Token Transfer Component

```typescript
import { useState } from 'react'
import { TokenTransferTransaction, AccountId, TokenId } from '@hashgraph/sdk'
import { toRawVST, VST_TOKEN } from './vst-token-utils.mjs'

export function TokenTransfer() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTransfer = async () => {
    setLoading(true)
    try {
      const rawAmount = toRawVST(Number(amount))

      const transferTx = new TokenTransferTransaction()
        .addTokenTransfer(
          TokenId.fromString(VST_TOKEN.ID),
          AccountId.fromString("0.0.9451398"), // Treasury (from)
          -rawAmount
        )
        .addTokenTransfer(
          TokenId.fromString(VST_TOKEN.ID),
          AccountId.fromString(recipient), // To
          rawAmount
        )

      // Execute transaction (requires client setup)
      const response = await transferTx.execute(client)
      const receipt = await response.getReceipt(client)

      console.log('Transfer successful:', receipt)
    } catch (error) {
      console.error('Transfer failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="token-transfer">
      <input
        type="text"
        placeholder="Recipient Account ID"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount (VST)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Transferring...' : 'Transfer VST'}
      </button>
    </div>
  )
}
```

---

## Important Considerations

### 1. Account Association

Before any account can receive VST tokens, it must associate with the token:

```typescript
import { TokenAssociateTransaction } from '@hashgraph/sdk'

const associateTx = new TokenAssociateTransaction()
  .setAccountId(AccountId.fromString("0.0.RECIPIENT_ID"))
  .addTokenId(TokenId.fromString(VST_TOKEN.ID))

await associateTx.execute(client)
```

### 2. Decimal Handling

Always remember to handle decimals correctly:

```javascript
// WRONG: Direct use without decimals
const wrong = 100 // This is 0.00000001 VST!

// CORRECT: Use utility function
import { toRawVST } from './vst-token-utils.mjs'
const correct = toRawVST(100) // This is 100 VST
```

### 3. Fixed Supply

The VST token has a **fixed supply of 100,000 tokens**. Key points:

- ✅ No additional tokens can be minted
- ✅ No tokens can be burned
- ✅ All 100,000 tokens currently in treasury
- ✅ Distribution is manual

### 4. Private Key Security

The private key in `.env` controls all token operations. In production:

- ❌ DO NOT commit `.env` to version control
- ❌ DO NOT share the private key
- ✅ Use environment variables
- ✅ Consider multi-sig setup
- ✅ Rotate keys regularly

---

## Network Links

### Hedera Explorer

- **Token**: [View VST Token](https://mainnet.mirrornode.hedera.com/api/v1/tokens/0.0.10048687)
- **Treasury Account**: [View Account](https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398)
- **Transactions**: [View Account Transactions](https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398/transactions)

### Mirror Node API

Base URL: `https://mainnet.mirrornode.hedera.com/api/v1`

Common Endpoints:
```
GET /tokens/0.0.10048687              - Token info
GET /accounts/0.0.9451398             - Account info
GET /accounts/0.0.9451398/transactions - Account transactions
```

---

## Troubleshooting

### Issue: "Token not associated"

**Solution**: Associate the token first before transferring:
```javascript
const associateTx = new TokenAssociateTransaction()
  .setAccountId(AccountId.fromString("0.0.RECIPIENT"))
  .addTokenId(TokenId.fromString("0.0.10048687"))
```

### Issue: "Insufficient balance"

**Solution**: Verify treasury has enough balance:
```bash
node verify-vst-token.mjs
```

### Issue: "Transaction fee exceeded"

**Solution**: Ensure account has sufficient HBAR (not just VST)

### Issue: "Invalid private key"

**Solution**: Verify private key format in `.env`:
```env
VITE_PRIVATE_KEY=d8fc50eb2ca055b1703bc9bc225889ffa29565b3e5ad63b6a384f2adba2daebb
```

---

## Documentation Files

Refer to these files for more details:

- **VST-MINTING-SUMMARY.txt** - Complete minting report
- **VST-TOKEN-INFO.md** - Detailed token information
- **vst-token-utils.mjs** - Source code for utilities

---

## Next Steps

1. ✅ Integrate VST token into your application
2. ✅ Create UI components for balance display and transfers
3. ✅ Set up token distribution to users
4. ✅ Test on testnet first (recommended)
5. ✅ Deploy to production

---

## Support

For issues or questions:

1. Check [Hedera Documentation](https://docs.hedera.com)
2. Review Mirror Node API docs
3. Check script outputs for error messages
4. Verify `.env` configuration

---

**Last Updated**: October 23, 2025
**Status**: Production Ready ✅

