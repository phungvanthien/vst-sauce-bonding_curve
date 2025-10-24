#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                   HashPack Connection Quick Test                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check running servers
echo "📋 Step 1: Checking running servers..."
echo ""
echo "Port 5173:"
lsof -i :5173 2>/dev/null | grep -v COMMAND || echo "   ✗ Not running"
echo ""
echo "Port 5174:"
lsof -i :5174 2>/dev/null | grep -v COMMAND || echo "   ✗ Not running"
echo ""

# Check .env
echo "📋 Step 2: Checking .env configuration..."
echo ""
if grep -q "VITE_HASHCONNECT_PROJECT_ID" .env; then
    echo "   ✓ VITE_HASHCONNECT_PROJECT_ID found"
    grep "VITE_HASHCONNECT_PROJECT_ID" .env
else
    echo "   ✗ VITE_HASHCONNECT_PROJECT_ID missing from .env"
fi
echo ""

# Check HashPackConnect component
echo "📋 Step 3: Checking HashPackConnect component..."
if [ -f "src/components/HashPackConnect.tsx" ]; then
    echo "   ✓ HashPackConnect.tsx exists"
else
    echo "   ✗ HashPackConnect.tsx not found"
fi
echo ""

# Check WalletContext
echo "📋 Step 4: Checking WalletContext..."
if [ -f "src/contexts/WalletContext.tsx" ]; then
    echo "   ✓ WalletContext.tsx exists"
else
    echo "   ✗ WalletContext.tsx not found"
fi
echo ""

# Check HashConnect lib
echo "📋 Step 5: Checking HashConnect library..."
if [ -f "src/lib/hashconnect.ts" ]; then
    echo "   ✓ src/lib/hashconnect.ts exists"
else
    echo "   ✗ src/lib/hashconnect.ts not found"
fi
echo ""

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                          Manual Test Steps                                    ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Open browser DevTools: F12"
echo "2. Go to Console tab"
echo "3. Open: http://localhost:5173/auth"
echo "4. Click 'Connect HashPack' button"
echo "5. Check console for logs (look for emoji prefixes)"
echo ""
echo "Expected logs:"
echo "   🔄 Initializing HashConnect..."
echo "   📱 Project ID: demo-app-v1"
echo "   ✅ HashConnect instance created"
echo "   🌐 Initializing HashConnect..."
echo "   ✅ HashConnect initialized successfully"
echo ""
echo "Then when clicking Connect:"
echo "   🚀 Initiating HashConnect connection..."
echo "   📲 Opening pairing modal..."
echo ""
echo "If error appears, check DEBUG-HASHPACK-CONNECTION.md for solutions"
echo ""
