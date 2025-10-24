# 🔍 HashPack Wallet Connection - Flow Analysis

## Complete Connection Flow Diagram

```
User clicks "Connect HashPack" Button
           ↓
    HashPackConnect.tsx
    handleConnect() called
           ↓
    connectHashPack() from WalletContext
           ↓
    connectHashPackWallet()
           ↓
    manager.initHashConnect() from HashConnectContext
           ↓
    HashConnectManager.initHashConnect()
           ↓
    ensureHashConnectInitialized()
           ↓
    new HashConnect() instance created
    setUpHashConnectEvents() registered
    instance.init() called
           ↓
    instance.openPairingModal()
           ↓
    [HashPack Extension Modal Appears]
    [User Approves in Extension]
           ↓
    pairingEvent fires
           ↓
    pairingData received with accountIds[]
           ↓
    connectionState = HashConnectConnectionState.Paired
    emit('pairing', newPairing)
           ↓
    HashConnectContext detects state change
           ↓
    WalletContext useEffect triggers
    setWalletInfo() with account ID
           ↓
    walletInfo.isConnected = true
           ↓
    AuthContext detects wallet connected
           ↓
    Auto-login triggered
           ↓
    Redirect to authenticated page
```

---

## Key Files & Functions

### 1. UI Component: HashPackConnect.tsx
```typescript
handleConnect() 
  → connectHashPack() from WalletContext
```

### 2. Context: WalletContext.tsx
```typescript
connectHashPackWallet() 
  → connectHashPack() from HashConnectContext
```

### 3. Context: HashConnectContext.tsx
```typescript
connect() 
  → manager.initHashConnect()
```

### 4. Manager: src/lib/hashconnect.ts
```typescript
initHashConnect()
  → ensureHashConnectInitialized()
  → instance.openPairingModal()
  → Events handled by setUpHashConnectEvents()
```

---

## Event Listeners

These must be registered BEFORE calling openPairingModal():

1. **pairingEvent**
   - Triggered: User approves in extension
   - Data: SessionData with accountIds[]
   - Action: Set connectionState = Paired

2. **disconnectionEvent**
   - Triggered: User disconnects
   - Action: Clear pairingData, set state = Disconnected

3. **connectionStatusChangeEvent**
   - Triggered: Status changes
   - Action: Update connectionState

---

## State Checks

The flow requires these states to match:

| State | Component | Value |
|-------|-----------|-------|
| manager.instance | HashConnectManager | initialized |
| manager.pairingData | HashConnectManager | SessionData |
| connectionState | HashConnectManager | Paired |
| walletInfo.isConnected | WalletContext | true |
| user | AuthContext | logged in |

---

## Potential Issues to Check

### Issue 1: Modal Never Opens
- Check if `ensureHashConnectInitialized()` completes
- Verify events are set up before `openPairingModal()`
- Check browser console for initialization logs

### Issue 2: Pairing Event Never Fires
- Check if HashPack extension approved
- Verify extension has accounts
- Check if `pairingEvent.on()` listener was registered

### Issue 3: WalletContext Not Updated
- Check if pairingData has accountIds
- Verify HashConnectContext emits 'pairing' event
- Check if WalletContext useEffect triggers

### Issue 4: Auto-Login Not Triggered
- Check if walletInfo.isConnected becomes true
- Verify AuthContext useEffect watches walletInfo
- Check if login() function is called

---

## Debug Steps

### Step 1: Check Instance Creation
```javascript
// In browser console after page load
console.log("Checking HashConnect manager...");
// Look for "✅ HashConnect initialized successfully" log
```

### Step 2: Check Modal Opens
```javascript
// After clicking Connect button
console.log("Modal should appear...");
// You should see "📲 Opening pairing modal..." log
```

### Step 3: Check Pairing Event
```javascript
// After approving in extension
console.log("Checking for pairing event...");
// You should see "✅ Pairing event received" log
```

### Step 4: Check Wallet State
```javascript
// In WalletContext
console.log("walletInfo:", walletInfo);
// Should show: {type: "hashpack", isConnected: true, accountId: "0.0.xxx"}
```

---

## Code Additions Needed

If anything is missing, add these:

### In HashConnectManager:
```typescript
// Ensure setUpHashConnectEvents is called BEFORE init()
this.setUpHashConnectEvents();
await this.instance.init();
```

### In HashConnectContext:
```typescript
// Ensure manager events are listened to
const handlePairing = (newPairing: SessionData) => {
  // Trigger re-render
};
manager.on('pairing', handlePairing);
```

### In WalletContext:
```typescript
// Ensure pairingData check
if (connectionState === HashConnectConnectionState.Paired &&
    pairingData?.accountIds?.[0]) {
  setWalletInfo({...});
}
```

---

## Test Commands

Run in terminal:
```bash
# Test script
bash TEST-HASHPACK.sh

# Check for errors
npm run build 2>&1 | grep error

# Run type check
npx tsc --noEmit
```

Run in browser console (F12):
```javascript
// Check manager state
console.log({
  hasInstance: !!window.hashConnectManager?.instance,
  connectionState: window.hashConnectManager?.getConnectionState?.(),
  pairingData: window.hashConnectManager?.getPairingData?.(),
  isConnected: window.hashConnectManager?.isConnected?.(),
});
```

---

**Last Updated**: October 23, 2025
