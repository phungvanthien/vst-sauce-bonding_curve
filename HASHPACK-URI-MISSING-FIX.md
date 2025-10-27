# 🔧 HashConnect "URI Missing" Error - Troubleshooting Guide

## 🚨 **Lỗi hiện tại:**
```
hashconnect.ts:202 hashconnect - URI Missing
initHashConnect @ hashconnect.ts:202
```

## ✅ **Đã sửa:**

### 1. **Tạo file .env với Project ID hợp lệ**
```bash
# File .env đã được tạo với:
VITE_HASHCONNECT_PROJECT_ID=9cb3860b32976358e227328e2b0a95a7
VITE_MIRROR_NODE_URL=https://mainnet.mirrornode.hedera.com/api/v1
VITE_BACKEND_URL=http://localhost:3001
```

### 2. **Cập nhật metadata HashConnect**
```typescript
const metadata = {
  name: "VST-Sauce Bonding Curve",
  description: "VST Token Bonding Curve Trading Platform",
  icons: [`https://raw.githubusercontent.com/phungvanthien/vst-sauce-bonding_curve/main/vst-assets/logo-512.png`],
  url: "http://localhost:5174"  // Updated port
};
```

### 3. **Thêm logging chi tiết**
- ✅ Logging trong `ensureHashConnectInitialized()`
- ✅ Logging trong `initHashConnect()`
- ✅ Error handling với chi tiết lỗi

## 🔄 **Bước tiếp theo:**

### 1. **Restart Development Server**
```bash
# Server đã được restart với environment variables mới
npm run dev
```

### 2. **Kiểm tra Browser Console**
Mở Developer Tools (F12) và kiểm tra console logs:
- ✅ `🔧 Initializing HashConnect with projectId: 9cb3860b32976358e227328e2b0a95a7`
- ✅ `🚀 Calling HashConnect.init()...`
- ✅ `✅ HashConnect initialized successfully`

### 3. **Test HashPack Connection**
1. Truy cập: `http://localhost:5174/`
2. Click "Connect HashPack"
3. Kiểm tra console logs

## 🛠️ **Nếu vẫn lỗi:**

### **Option 1: Clear Browser Cache**
```bash
# Clear localStorage
localStorage.clear();

# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
```

### **Option 2: Check HashPack Wallet**
- ✅ HashPack extension đã cài đặt
- ✅ HashPack đã được update
- ✅ Wallet đã được unlock

### **Option 3: Alternative Project ID**
Nếu vẫn lỗi, có thể thử project ID khác:
```bash
# Edit .env file
VITE_HASHCONNECT_PROJECT_ID=demo-app-v2
```

## 📋 **Environment Variables Checklist:**
- ✅ `VITE_HASHCONNECT_PROJECT_ID` - Set
- ✅ `VITE_MIRROR_NODE_URL` - Set  
- ✅ `VITE_BACKEND_URL` - Set
- ✅ Server restarted - Done
- ✅ Metadata updated - Done

## 🎯 **Expected Result:**
Sau khi restart server, HashConnect sẽ:
1. ✅ Initialize với project ID hợp lệ
2. ✅ Tạo URI thành công
3. ✅ Mở pairing modal
4. ✅ Kết nối với HashPack wallet

## 📞 **Support:**
Nếu vẫn gặp lỗi, hãy:
1. Kiểm tra browser console logs
2. Chụp screenshot lỗi
3. Cung cấp thông tin browser và HashPack version
