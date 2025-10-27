# 🔧 HashPack Connection Fix - Complete Guide

## ✅ **Đã sửa:**

### 1. **Cập nhật URL trong metadata**
- ✅ Sửa từ `localhost:5174` → `localhost:5173`
- ✅ Metadata URL giờ đúng với server port

### 2. **Thêm Debug Component**
- ✅ `HashConnectDebug` component trên trang `/auth`
- ✅ Hiển thị trạng thái HashConnect, HashPack, Project ID
- ✅ Nút "Clear Storage & Refresh"

### 3. **Environment Variables**
- ✅ File `.env` với Project ID hợp lệ
- ✅ Server đã restart để load env vars

## 🎯 **Bước tiếp theo:**

### 1. **Truy cập trang Auth:**
```
http://192.168.1.3:5173/auth
```

### 2. **Kiểm tra Debug Info:**
- Click "Show Debug Info" trên trang auth
- Kiểm tra tất cả status phải là ✅ (green)

### 3. **Nếu có lỗi:**
- Click "Clear Storage & Refresh"
- Refresh trang
- Thử lại connect HashPack

### 4. **Kiểm tra Console (F12):**
Tìm các log messages:
```
✅ 🔧 Initializing HashConnect with projectId: 9cb3860b32976358e227328e2b0a95a7
✅ 🚀 Calling HashConnect.init()...
✅ ✅ HashConnect initialized successfully
```

## 🛠️ **Troubleshooting:**

### **Nếu HashPack Extension không được detect:**
1. Cài đặt HashPack: https://www.hashpack.app/
2. Update extension lên version mới nhất
3. Restart browser

### **Nếu vẫn "URI Missing":**
1. Clear browser cache hoàn toàn
2. Thử incognito mode
3. Kiểm tra firewall/antivirus

### **Nếu Project ID không được load:**
1. Restart server: `pkill -f vite && npm run dev`
2. Kiểm tra file `.env` tồn tại
3. Verify environment variables

## 📱 **Test URLs:**
- **Auth Page:** `http://192.168.1.3:5173/auth`
- **Main App:** `http://192.168.1.3:5173/`
- **Local:** `http://localhost:5173/auth`

## 🔍 **Debug Commands (Browser Console):**
```javascript
// Check HashConnect
console.log('HashConnect:', typeof window.hashconnect);

// Check HashPack
console.log('HashPack:', typeof window.hashpack);

// Clear everything
localStorage.clear(); sessionStorage.clear(); location.reload();
```

## ✅ **Expected Result:**
Sau khi sửa, HashPack connection sẽ:
1. ✅ Initialize thành công với Project ID
2. ✅ Mở pairing modal
3. ✅ Kết nối với HashPack wallet
4. ✅ Hiển thị account info

**Hãy thử lại và cho tôi biết kết quả!** 🚀
