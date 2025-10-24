#!/bin/bash

# VST Token Quick Commands
# Run these commands to manage your VST token and frontend

echo "╔════════════════════════════════════════════════════════╗"
echo "║        VST Token & Frontend - Quick Commands           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 AVAILABLE COMMANDS:${NC}\n"

echo -e "${GREEN}Frontend Commands:${NC}"
echo "  1. Start dev server:"
echo "     npm run dev"
echo ""
echo "  2. Build for production:"
echo "     npm build"
echo ""
echo "  3. Lint code:"
echo "     npm run lint"
echo ""

echo -e "${GREEN}Token Commands:${NC}"
echo "  4. Verify VST token information:"
echo "     node verify-vst-token.mjs"
echo ""
echo "  5. Mint new VST token (if needed):"
echo "     node mint-vst-token.mjs"
echo ""

echo -e "${GREEN}Development Commands:${NC}"
echo "  6. Install dependencies:"
echo "     npm install"
echo ""
echo "  7. Clean node_modules and reinstall:"
echo "     rm -rf node_modules package-lock.json && npm install"
echo ""

echo -e "${GREEN}Documentation:${NC}"
echo "  8. View setup guide:"
echo "     cat VST-SETUP-GUIDE.md"
echo ""
echo "  9. View token info:"
echo "     cat VST-TOKEN-INFO.md"
echo ""
echo "  10. View minting summary:"
echo "      cat VST-MINTING-SUMMARY.txt"
echo ""

echo -e "${BLUE}🔗 USEFUL LINKS:${NC}\n"
echo "  Frontend:          http://localhost:5173"
echo "  Token on Hedera:   https://mainnet.mirrornode.hedera.com/api/v1/tokens/0.0.10048687"
echo "  Treasury Account:  https://mainnet.mirrornode.hedera.com/api/v1/accounts/0.0.9451398"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  • Keep .env file secret - don't commit to git"
echo "  • Private key controls all token operations"
echo "  • Always test on testnet first"
echo "  • Ensure accounts are associated before transfers"
echo ""

echo -e "${GREEN}✨ Ready to go! Choose a command above to get started.${NC}\n"
