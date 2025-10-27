#!/bin/bash

echo "🔍 Debugging Blank Page Issue..."
echo "=================================="

echo "📊 Server Status:"
echo "   Local: http://localhost:5173/"
echo "   Network: http://192.168.1.3:5173/"
echo ""

echo "🌐 Testing Network Access:"
LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
NETWORK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://192.168.1.3:5173/)

echo "   Local (localhost:5173): $LOCAL_STATUS"
echo "   Network (192.168.1.3:5173): $NETWORK_STATUS"
echo ""

if [ "$NETWORK_STATUS" = "200" ]; then
    echo "✅ Server is accessible from network"
    echo ""
    echo "🔧 Troubleshooting Steps:"
    echo "   1. Clear browser cache (Ctrl+Shift+Delete)"
    echo "   2. Try incognito/private mode"
    echo "   3. Check browser console (F12) for JavaScript errors"
    echo "   4. Try different browser"
    echo "   5. Check firewall settings"
    echo ""
    echo "📱 Test URLs:"
    echo "   ✅ Correct: http://192.168.1.3:5173/"
    echo "   ❌ Wrong:  http://192.168.1.3:5174/"
    echo ""
    echo "🔍 Browser Console Check:"
    echo "   Open Developer Tools (F12)"
    echo "   Look for errors in Console tab"
    echo "   Check Network tab for failed requests"
else
    echo "❌ Server not accessible from network"
    echo "   Check firewall settings"
    echo "   Verify IP address: 192.168.1.3"
fi

echo ""
echo "📋 Environment Check:"
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    echo "   📄 HashConnect Project ID: $(grep VITE_HASHCONNECT_PROJECT_ID .env | cut -d'=' -f2)"
else
    echo "   ❌ .env file missing"
fi

echo ""
echo "🚀 Quick Fix Commands:"
echo "   # Restart server:"
echo "   pkill -f vite && npm run dev"
echo ""
echo "   # Check server logs:"
echo "   npm run dev"
