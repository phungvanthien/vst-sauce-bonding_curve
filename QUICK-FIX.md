# 🚀 HashPack Connection - Quick Fix Guide

## ⚡ 2-Minute Fix

### Step 1: Stop & Restart Server
```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 2: Clear Browser
- Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
- Clear all cookies and cache
- Close and reopen browser tab

### Step 3: Hard Refresh
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### Step 4: Check Browser Console
- Press `F12`
- Go to Console tab
- Look for logs starting with 🔄, 📱, ✅

---

## ✅ When It Works

You should see:
```
🔄 Initializing HashConnect...
📱 Project ID: demo-app-v1
✅ HashConnect instance created
🌐 Initializing HashConnect...
✅ HashConnect initialized successfully
```

Then when you click Connect:
```
🚀 Initiating HashConnect connection...
📲 Opening pairing modal...
✅ Pairing event received: {...}
📡 Connection status changed: Paired
```

---

## ❌ If Error Appears

Look for error message in red in console, then:

### Error: "extension not found"
→ Install HashPack: https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkyajmt3qywjhd

### Error: "Connection timeout"
→ Full reset:
```bash
rm -rf node_modules
npm cache clean --force
npm install
npm run dev
```

### Warning: "Using demo project ID"
→ NORMAL for development! This is expected.

---

## 📋 Checklist

- [ ] HashPack extension installed?
- [ ] Extension enabled in browser?
- [ ] Dev server running?
- [ ] Browser cache cleared?
- [ ] Hard refresh done?
- [ ] Console checked for errors?

---

## 🔗 Links

- HashPack Extension: https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkyajmt3qywjhd
- Auth Page: http://localhost:5173/auth
- Full Guide: See HASHPACK-TROUBLESHOOTING.md

---

## 💡 Pro Tip

If still stuck: 
1. Copy full console output (F12 → Console)
2. Paste it in your question
3. That will help debug the issue faster!

**Status**: ✅ Ready to Test
