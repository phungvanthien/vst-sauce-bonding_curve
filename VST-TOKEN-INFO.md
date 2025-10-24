# VST Token - Minting Report 🪙

## ✅ Minting Status: COMPLETED

Token VST has been successfully minted on **Hedera Mainnet**.

---

## 📊 Token Information

| Property | Value |
|----------|-------|
| **Token Name** | Vistia Token |
| **Token Symbol** | VST |
| **Token ID** | `0.0.10048687` |
| **Token Type** | Fungible |
| **Decimals** | 8 |
| **Total Supply** | 100,000 VST |
| **Max Supply** | 100,000 VST |
| **Supply Type** | Finite |
| **Treasury Account** | `0.0.9451398` |

---

## 💰 Token Economics

- **Initial Supply**: 100,000 VST
- **Total Supply**: 100,000 VST (Fixed)
- **Decimals**: 8
  - Smallest unit: 0.00000001 VST (1 tinybar)
  - Display format: `balance / 10^8`

### Supply Breakdown
```
Total: 100,000.00000000 VST
In Treasury: 100,000.00000000 VST (Raw: 10,000,000,000,000)
Available for Distribution: Ready
```

---

## 🏛️ Treasury Account

- **Account ID**: `0.0.9451398`
- **Current VST Balance**: 100,000 VST
- **Role**: Token Holder & Operator
- **Status**: ✅ Active

---

## 🔐 Security Configuration

The following keys have been set for the token:

| Key Type | Status | Owner |
|----------|--------|-------|
| **Admin Key** | ✅ Set | Account `0.0.9451398` |
| **Supply Key** | ✅ Set | Account `0.0.9451398` |
| **Freeze Key** | ✅ Set | Account `0.0.9451398` |
| **Wipe Key** | ✅ Set | Account `0.0.9451398` |
| **KYC Key** | ✅ Set | Account `0.0.9451398` |

### Key Permissions Enabled:
- ✅ Token management (mint, burn)
- ✅ Account freezing (if needed)
- ✅ Token wiping (if needed)
- ✅ KYC requirements (if enabled)

---

## 🔗 Network Information

- **Network**: Hedera Mainnet
- **RPC Endpoint**: `https://mainnet.mirrornode.hedera.com/api/v1`
- **Explorer URL**: [View on Hedera Explorer](https://mainnet.mirrornode.hedera.com/api/v1/tokens/0.0.10048687)

---

## 📝 Usage Examples

### JavaScript/Node.js

```javascript
import { TokenId } from "@hashgraph/sdk";

// Create token reference
const tokenId = TokenId.fromString("0.0.10048687");

// Usage in transactions
const amount = 100 * 10 ** 8; // 100 VST tokens
```

### Environment Configuration

Add to your `.env` file:
```
VITE_VST_TOKEN_ID=0.0.10048687
VITE_VST_DECIMALS=8
VITE_VST_SYMBOL=VST
VITE_VST_NAME=Vistia Token
```

### Token Transfer Example

```javascript
import {
  TokenTransferTransaction,
  AccountId,
  TokenId,
} from "@hashgraph/sdk";

const tokenTransferTx = new TokenTransferTransaction()
  .addTokenTransfer(
    TokenId.fromString("0.0.10048687"),
    AccountId.fromString("0.0.9451398"), // from
    -100 * 10 ** 8 // amount (100 VST)
  )
  .addTokenTransfer(
    TokenId.fromString("0.0.10048687"),
    AccountId.fromString("0.0.RECIPIENT_ID"), // to
    100 * 10 ** 8 // amount (100 VST)
  );
```

---

## 🚀 Next Steps

### 1. Account Association
Before users can receive VST tokens, their accounts must be associated:

```javascript
import { TokenAssociateTransaction } from "@hashgraph/sdk";

const associateTx = new TokenAssociateTransaction()
  .setAccountId(AccountId.fromString("0.0.ACCOUNT_ID"))
  .addTokenId(TokenId.fromString("0.0.10048687"));
```

### 2. Token Distribution
Transfer VST tokens to various addresses:
- Development team
- Marketing
- Community rewards
- etc.

### 3. Liquidity Pool Setup
If setting up DEX pools, ensure:
- Adequate liquidity reserve
- Pair with HBAR or stable tokens
- Set proper slippage tolerance

---

## 📋 Transaction History

### Mint Transaction
- **Status**: ✅ SUCCESS
- **Timestamp**: Oct 23, 2025
- **Operation**: Token Creation + Initial Mint
- **Amount**: 100,000 VST
- **Treasury**: 0.0.9451398

---

## 🔍 Verification Links

- **Token Details**: https://mainnet.mirrornode.hedera.com/api/v1/tokens/0.0.10048687
- **Treasury Account**: https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398
- **Transactions**: https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398/transactions

---

## ⚠️ Important Notes

1. **Supply is Fixed**: Max supply is 100,000 VST. No additional tokens can be minted.
2. **Treasury Holds All**: Currently, all tokens are held in the treasury account.
3. **Distribution Required**: Manual distribution to user accounts is required.
4. **Account Association**: Receiving accounts must associate the token first.
5. **Key Custody**: All keys are controlled by account `0.0.9451398`.

---

## 📞 Support

For issues or questions regarding VST token:
1. Check Hedera documentation: https://docs.hedera.com
2. Review transaction logs on Mirror Node
3. Verify account balance and associations

---

**Report Generated**: October 23, 2025
**Status**: ✅ Production Ready

