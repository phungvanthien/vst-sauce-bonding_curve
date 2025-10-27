#!/bin/bash

# Script to create .env file with HashConnect Project ID
echo "🔧 Creating .env file with HashConnect Project ID..."

cat > .env << 'EOF'
VITE_HASHCONNECT_PROJECT_ID=9cb3860b32976358e227328e2b0a95a7
VITE_WALLETCONNECT_PROJECT_ID=a3dc61a2a176b8bd0771d9c26a8ea13f
VITE_MIRROR_NODE_URL=https://mainnet.mirrornode.hedera.com/api/v1
VITE_VAULT_ADDRESS=0xEA316d96F85e662aa7e213A900A87dbDDfCbE99a
VITE_TOKEN_ADDRESS=0x000000000000000000000000000000000006f89a
VITE_VISTIA_BASE_URL_1=https://api.vistia.co/api/v2_2/
VITE_BACKEND_URL=http://localhost:3001
VITE_NATIVE_TOKEN_ID=0.0.10048687
VITE_NATIVE_TOKEN_ADDRESS=0x00000000000000000000000000000000009954af
VITE_RECEIVER_ADDRESS=0x539425c9d4a66a2ace88dea7533ac775df4e40e2
VITE_RECEIVER_ACCOUNT_ID=0.0.9451398
EOF

echo "✅ .env file created successfully!"
echo "📋 Environment variables set:"
echo "   - VITE_HASHCONNECT_PROJECT_ID: 9cb3860b32976358e227328e2b0a95a7"
echo "   - VITE_MIRROR_NODE_URL: https://mainnet.mirrornode.hedera.com/api/v1"
echo "   - VITE_BACKEND_URL: http://localhost:3001"
echo ""
echo "🔄 Please restart your development server:"
echo "   npm run dev"
