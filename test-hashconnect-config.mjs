#!/usr/bin/env node

// Test script to verify HashConnect configuration
console.log("🔧 Testing HashConnect Configuration...\n");

// Check environment variables
const requiredEnvVars = [
  'VITE_HASHCONNECT_PROJECT_ID',
  'VITE_MIRROR_NODE_URL',
  'VITE_BACKEND_URL'
];

console.log("📋 Environment Variables:");
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${value}`);
  } else {
    console.log(`   ❌ ${envVar}: NOT SET`);
  }
});

console.log("\n🔍 HashConnect Project ID Validation:");
const projectId = process.env.VITE_HASHCONNECT_PROJECT_ID || "demo-app-v1";
if (projectId === "demo-app-v1") {
  console.log("   ⚠️  Using demo project ID - may cause 'URI Missing' error");
  console.log("   💡 Get a real Project ID from: https://www.hashpack.app/");
} else {
  console.log(`   ✅ Using real project ID: ${projectId}`);
}

console.log("\n🌐 Metadata Configuration:");
const metadata = {
  name: "VST-Sauce Bonding Curve",
  description: "VST Token Bonding Curve Trading Platform",
  icons: [`https://raw.githubusercontent.com/phungvanthien/vst-sauce-bonding_curve/main/vst-assets/logo-512.png`],
  url: "http://localhost:5174"
};

console.log("   📱 App Name:", metadata.name);
console.log("   📝 Description:", metadata.description);
console.log("   🖼️  Icon URL:", metadata.icons[0]);
console.log("   🌐 URL:", metadata.url);

console.log("\n🔧 Troubleshooting Tips:");
console.log("   1. Ensure .env file exists with VITE_HASHCONNECT_PROJECT_ID");
console.log("   2. Restart development server after creating .env");
console.log("   3. Check browser console for detailed error messages");
console.log("   4. Verify HashPack wallet is installed and updated");
console.log("   5. Try clearing browser cache and localStorage");

console.log("\n✅ Configuration test completed!");
