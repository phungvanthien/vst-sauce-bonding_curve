# 🔍 HashPack Connection Debug Guide

## Problem
Cannot connect wallet on http://localhost:5173/auth

---

## Step 1: Check Browser Console

1. **Open DevTools**: Press `F12`
2. **Go to Console tab**
3. **Clear console** (Ctrl+L or Cmd+K)
4. **Refresh page** (Ctrl+R)
5. **Watch for logs** with emoji prefixes

### What to look for:

#### ✅ GOOD (Normal Initialization):
```
🔄 Initializing HashConnect...
📱 Project ID: demo-app-v1
✅ HashConnect instance created
🌐 Initializing HashConnect...
✅ HashConnect initialized successfully
```

#### ❌ BAD (Errors):
```
❌ Error initializing HashConnect: [Error message]
📋 Error details: {...}
```

---

## Step 2: Trigger Connection

1. **Look for "Connect HashPack" button** on auth page
2. **Click the button**
3. **Watch console for logs**

### Expected Logs:
```
🚀 Initiating HashConnect connection...
📲 Opening pairing modal...
```

### Check for Errors:
- Look for red error messages
- Check if modal popup appears
- Check if HashPack extension notification appears

---

## Step 3: Common Issues & Fixes

### Issue 1: "Modal Won't Open"
**Symptoms**: 
- Click button but nothing happens
- No modal appears
- Console shows no connection logs

**Fix**:
```bash
# Kill all dev servers
kill 5173
kill 5174

# Restart
npm run dev

# Hard refresh browser
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Issue 2: "Extension Not Found"
**Symptoms**:
```
❌ Error: HashPack extension not detected
```

**Fix**:
- Install HashPack: https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkyajmt3qywjhd
- Refresh page
- Try again

### Issue 3: "Project ID Error"
**Symptoms**:
```
❌ Error about project ID or initialization
```

**Fix**:
- Check `.env` file has: `VITE_HASHCONNECT_PROJECT_ID=demo-app-v1`
- Restart dev server
- Hard refresh browser

### Issue 4: "No Pairing Data"
**Symptoms**:
- Connects but shows "undefined"
- Modal closes but no account shows

**Fix**:
- Check HashPack extension → Account imported?
- Check browser localStorage for `hashconnect_` entries
- Try disconnecting and reconnecting

---

## Step 4: Check Browser Storage

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Select Local Storage**
4. **Look for entries** starting with `hashconnect_`

### Should See:
```
hashconnect_pairingData
hashconnect_sessionData
hashconnect_...
```

### If Empty:
- Connection not persisting
- Try connecting again
- Check browser extension permissions

---

## Step 5: Check Network Requests

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Click Connect HashPack button**
4. **Look for failed requests** (marked with ❌)

### Expected: ✅ All requests successful

---

## Debug Code to Run in Console

Copy and paste in browser console (F12) to debug:

```javascript
// Check HashPack Extension
console.log("🔍 Checking HashPack Extension:");
if (window.hashPack) {
  console.log("✅ HashPack Extension Found");
} else {
  console.log("❌ HashPack Extension Not Found");
}

// Check Local Storage
console.log("🔍 Checking LocalStorage:");
for (let key in localStorage) {
  if (key.includes('hashconnect')) {
    console.log(key, localStorage.getItem(key));
  }
}

// Check React Query
console.log("🔍 Checking App State:");
console.log("Window location:", window.location.href);
console.log("Is HTTPS:", window.location.protocol === 'https:');
```

---

## Full Test Sequence

1. **Stop server** → `Ctrl+C`
2. **Clear cache** → `Ctrl+Shift+Delete`
3. **Restart server** → `npm run dev`
4. **Go to URL** → `http://localhost:5173/auth`
5. **Open console** → `F12`
6. **Clear console** → `Ctrl+L`
7. **Refresh page** → `Ctrl+R`
8. **Wait for logs** → Watch console
9. **Click Connect** → Click "Connect HashPack" button
10. **Watch modal** → See if pairing modal appears

---

## If Still Not Working

Provide these details:

1. **Browser & OS**:
   ```
   Browser: Chrome/Edge/Firefox/Safari
   OS: Windows/Mac/Linux
   Version: ...
   ```

2. **Console Output** (after clicking Connect):
   ```
   [Paste full console output here]
   ```

3. **Steps Taken**:
   ```
   [List what you've tried]
   ```

4. **Screenshots**:
   - Browser console showing errors
   - Auth page with connect button
   - HashPack extension icon (visible or not?)

---

## Technical Details

### Connection Flow:
```
Click "Connect HashPack"
        ↓
connectHashPack() called
        ↓
HashConnectContext.connect()
        ↓
manager.initHashConnect()
        ↓
instance.openPairingModal()
        ↓
Modal appears
        ↓
User approves in extension
        ↓
pairingEvent fires
        ↓
WalletContext updated
        ↓
walletInfo set with account
```

### Key Functions:
- `HashPackConnect.tsx` → UI component
- `WalletContext.tsx` → State management
- `HashConnectContext.tsx` → Connection logic
- `src/lib/hashconnect.ts` → HashConnect wrapper

---

**Last Updated**: October 23, 2025
