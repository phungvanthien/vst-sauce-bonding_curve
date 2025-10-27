#!/usr/bin/env node

// Test HashConnect configuration and environment
console.log("🔧 Testing HashConnect Configuration for Auth Page...\n");

// Check if we're in browser environment
if (typeof window === 'undefined') {
  console.log("❌ This script should run in browser environment");
  console.log("💡 Open browser console and run: testHashConnect()");
  process.exit(1);
}

// Test function for browser console
const testHashConnect = () => {
  console.log("🔍 HashConnect Test Results:");
  console.log("============================");
  
  // Check environment variables
  console.log("\n📋 Environment Variables:");
  const projectId = import.meta.env.VITE_HASHCONNECT_PROJECT_ID;
  console.log(`   VITE_HASHCONNECT_PROJECT_ID: ${projectId || 'NOT SET'}`);
  
  // Check HashConnect availability
  console.log("\n🔧 HashConnect Library:");
  try {
    const { HashConnect } = require('hashconnect');
    console.log("   ✅ HashConnect library loaded");
  } catch (error) {
    console.log("   ❌ HashConnect library not available:", error.message);
  }
  
  // Check localStorage for previous connections
  console.log("\n💾 LocalStorage Check:");
  const hashconnectData = localStorage.getItem('hashconnect');
  if (hashconnectData) {
    console.log("   ✅ Previous HashConnect data found");
    try {
      const data = JSON.parse(hashconnectData);
      console.log("   📊 Stored pairings:", Object.keys(data).length);
    } catch (error) {
      console.log("   ❌ Invalid HashConnect data:", error.message);
    }
  } else {
    console.log("   ⚠️  No previous HashConnect data");
  }
  
  // Check HashPack extension
  console.log("\n🔌 HashPack Extension:");
  if (window.hashpack) {
    console.log("   ✅ HashPack extension detected");
  } else {
    console.log("   ❌ HashPack extension not detected");
    console.log("   💡 Install HashPack: https://www.hashpack.app/");
  }
  
  console.log("\n🔧 Troubleshooting Steps:");
  console.log("   1. Clear localStorage: localStorage.clear()");
  console.log("   2. Refresh page");
  console.log("   3. Check browser console for errors");
  console.log("   4. Ensure HashPack extension is installed");
  console.log("   5. Try incognito mode");
};

// Export for browser use
if (typeof window !== 'undefined') {
  window.testHashConnect = testHashConnect;
  console.log("✅ Test function available as: window.testHashConnect()");
}

console.log("🌐 Browser Test Instructions:");
console.log("   1. Open: http://192.168.1.3:5173/auth");
console.log("   2. Open Developer Tools (F12)");
console.log("   3. Go to Console tab");
console.log("   4. Run: testHashConnect()");
console.log("   5. Check for errors when clicking 'Connect HashPack'");
