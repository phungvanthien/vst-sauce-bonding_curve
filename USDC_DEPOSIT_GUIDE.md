# USDC Deposit Guide for Hedera Vault

## 📋 Contract Analysis (Vault.sol)

### Key Functions:
- **`deposit(uint256 amount)`**: Main deposit function (line 143-173)
- **`token1`**: USDC token for deposits (line 30)
- **Requirements**: User must approve USDC before deposit (line 151)

## 🔧 Current Configuration

### Vault Settings:
- **Token**: USDC (6 decimals)
- **Token ID**: `0.0.456858` (Real USDC on Hedera Mainnet)
- **Vault Contract**: `0.0.1234567` (from env)

### Code Implementation:
1. **Approve Flow** (`approveToken`): ✅ Implemented
2. **Deposit Flow** (`deposit`): ✅ Implemented  
3. **Balance Check** (`getTokenBalance`): ✅ SDK + Mirror Node
4. **Error Handling**: ✅ HashConnect integration

## 🎯 USDC Deposit Flow

### Prerequisites:
1. **Associate USDC Token**:
   - Open HashPack → Assets → Add Token
   - Enter: `0.0.456858`
   - Confirm association

2. **Have USDC Balance**:
   - Buy from exchanges (SaucerSwap, etc)
   - Bridge from other chains
   - Or use existing USDC

### Deposit Steps:
1. **Check Balance**: Click "🔧 Check Balance (SDK)"
2. **Approve USDC**: Click "🔐 Approve Token"
3. **Deposit**: Enter amount and click "Confirm Deposit"

## 🔍 Debug Tools Available

### Balance Checking:
- **"🔍 Debug Mirror Node Direct"**: Raw Mirror Node API
- **"🔧 Check Balance (SDK)"**: Hedera SDK query
- **"📊 Check Balance (Hook)"**: App logic

### Token Info:
- **"ℹ️ USDC Info"**: Token details and where to get USDC
- **"🔗 Associate USDC (Manual)"**: Step-by-step association guide

## ⚡ Technical Details

### Smart Contract Flow:
```solidity
// 1. User approves USDC for vault
token1.approve(vaultAddress, amount);

// 2. User calls deposit
vault.deposit(amount);

// 3. Contract transfers USDC
token1.safeTransferFrom(msg.sender, address(this), amount);

// 4. User receives shares (1:1 ratio)
shares[msg.sender] += amount;
```

### SDK Implementation:
```typescript
// 1. Approve USDC
await approveToken(tokenAddress, vaultAddress, amount);

// 2. Deposit to vault  
await deposit(vaultAddress, amount);
```

## 🚨 Common Issues & Solutions

### Balance = 0:
- **Check**: USDC token associated?
- **Solution**: Associate via HashPack manually

### Approve Fails:
- **Check**: HashConnect connected?
- **Solution**: Reconnect wallet and try again

### SDK Errors:
- **Fallback**: Mirror Node queries implemented
- **Alternative**: Manual transaction via HashPack

## 📈 Status

### ✅ Working:
- USDC configuration
- Approve/Deposit logic
- Error handling
- Multiple balance check methods

### ⚠️ Notes:
- Real USDC token ID: `0.0.456858`
- Contract queries temporarily disabled (protobuf issues)
- Manual token association required