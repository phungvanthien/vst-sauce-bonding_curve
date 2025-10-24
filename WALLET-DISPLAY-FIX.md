# 🔧 Fix: Wallet Shows "undefined" When Connected

## Problem
After connecting HashPack wallet, it shows "undefined" instead of the account ID/address.

## Root Cause
The account ID might not be properly passed from the HashConnect pairing data to the WalletContext.

---

## Solution 1: Restart & Test (Quick Fix)

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Restart
npm run dev

# 3. Hard refresh browser (Ctrl+Shift+R)

# 4. Try connecting again
```

---

## Solution 2: Debug with Browser Console

1. **Open DevTools**: Press `F12`
2. **Go to Console tab**
3. **Click "Connect HashPack"**
4. **Look for these logs**:

```
📊 WalletContext HashPack Update: {
  connectionState: "Paired",
  isPaired: true,
  hasPairingData: true,
  accountIds: ["0.0.123456"],
  firstAccount: "0.0.123456"
}
✅ Setting wallet info with account: 0.0.123456
```

---

## What the Fix Provides

✅ **Better Account Display**:
- Shows Hedera account ID (0.0.xxx) correctly
- Shows EVM addresses as 0x1234...5678
- Fallback message if account ID is missing

✅ **Helpful Hover Tooltips**:
- Hover over account button to see full details

✅ **Debug Information**:
- Console logs show what data is being received
- Warnings if account ID is missing

---

## Expected Result

### Before (❌ Broken):
```
Connected Wallet: undefined
```

### After (✅ Fixed):
```
Connected Wallet: 0.0.9451398
```

---

## If Still Showing "undefined"

### Step 1: Check WalletContext
Open `src/contexts/WalletContext.tsx` and look for the HashPack update effect. Add logging:

```typescript
useEffect(() => {
  console.log("📊 HashPack Update:", {
    connectionState,
    pairingData: pairingData,
    firstAccount: pairingData?.accountIds?.[0],
  });
  
  if (
    connectionState === HashConnectConnectionState.Paired &&
    pairingData?.accountIds?.[0]
  ) {
    const account = pairingData.accountIds[0];
    console.log("✅ Setting account to:", account);
    setWalletInfo({
      type: "hashpack",
      address: account,
      accountId: account,
      isConnected: true,
      isConnecting: false,
      manager,
      pairingData,
    });
  }
}, [connectionState, pairingData, manager]);
```

### Step 2: Check Browser Console
After connecting, look for:
- Is `pairingData` null or undefined?
- Does `pairingData.accountIds` exist?
- What is in `accountIds` array?

### Step 3: Screenshot Issue
If still stuck, take a screenshot of:
1. Browser console (F12)
2. The "Connected Wallet: undefined" display
And provide both for debugging

---

## Technical Details

### Where Data Flows

```
HashPack Extension
        ↓
HashConnect Pairing Event
        ↓
WalletContext (receives pairing data)
        ↓
setWalletInfo with account ID
        ↓
HashPackConnect Component
        ↓
Display account on UI
```

### What Changed

**File**: `src/components/HashPackConnect.tsx`

Added `getAccountDisplay()` function that:
1. Checks if walletInfo exists
2. Uses `accountId` first, falls back to `address`
3. Handles Hedera IDs (0.0.xxx) and EVM addresses (0x...)
4. Shows helpful warnings in console if data is missing

---

## Common Causes of "undefined"

| Cause | Fix |
|-------|-----|
| `accountId` is null | Check if pairing data has `accountIds` array |
| `address` is null | Ensure HashConnect passes account in pairing event |
| WalletContext not updated | Hard refresh browser + restart server |
| Stale state | Clear localStorage + cookies |

---

## Pro Tips

1. **Always check console (F12)** for "⚠️" warnings
2. **Check Network tab** → All requests successful?
3. **Check HashPack extension** → Account showing there?
4. **Try different browser** → Isolate browser extension issues
5. **Check localStorage** → `hashconnect_` entries present?

---

## Quick Test Steps

1. Open: http://localhost:5173/auth
2. Press `F12` (DevTools)
3. Go to **Console** tab
4. Click "Connect HashPack"
5. Look for log messages
6. Check if account displays

---

## If Error Persists

Run this in browser console to debug:
```javascript
// See what's in wallet context
console.log("Checking wallet info...");
localStorage.forEach((value, key) => {
  if (key.includes('hashconnect')) {
    console.log(key, value);
  }
});
```

---

**Status**: ✅ Fixed
**Updated**: October 23, 2025
