import {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

async function mintVSTToken() {
  try {
    console.log("🚀 Starting VST Token Minting Process...\n");

    // Configuration
    const operatorId = process.env.VITE_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.VITE_PRIVATE_KEY;
    const treasuryId = process.env.VITE_TREASURY_ID;

    if (!operatorId || !operatorKey || !treasuryId) {
      throw new Error(
        `Missing required environment variables. Got: operatorId=${operatorId}, treasuryId=${treasuryId}`
      );
    }

    console.log("📋 Configuration:");
    console.log(`   Operator Account: ${operatorId}`);
    console.log(`   Treasury Account: ${treasuryId}`);
    console.log(`   Token Name: VST (Vistia Token)`);
    console.log(`   Symbol: VST`);
    console.log(`   Decimals: 8`);
    console.log(`   Max Supply: 100,000`);
    console.log(`   Supply Type: Finite\n`);

    // Initialize client for mainnet
    const client = Client.forMainnet();

    // Set operator
    const accountId = AccountId.fromString(operatorId);
    const privateKey = PrivateKey.fromStringECDSA(operatorKey);

    client.setOperator(accountId, privateKey);

    console.log("✅ Client initialized for Hedera Mainnet\n");

    // Step 1: Create Token
    console.log("📝 Step 1: Creating VST Token...");
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName("Vistia Token")
      .setTokenSymbol("VST")
      .setTokenType(TokenType.Fungible)
      .setSupplyType(TokenSupplyType.Finite)
      .setInitialSupply(0) // Will mint later
      .setMaxSupply(100000 * 10 ** 8) // 100,000 tokens with 8 decimals
      .setDecimals(8)
      .setTreasuryAccountId(AccountId.fromString(treasuryId))
      .setAdminKey(privateKey)
      .setSupplyKey(privateKey)
      .setFreezeKey(privateKey)
      .setWipeKey(privateKey)
      .setKycKey(privateKey)
      .setFeeScheduleKey(privateKey)
      .setTransactionMemo("VST Token - Vistia Trading");

    const tokenCreateResponse = await tokenCreateTx.execute(client);
    const tokenCreateReceipt = await tokenCreateResponse.getReceipt(client);

    const tokenId = tokenCreateReceipt.tokenId;
    console.log(`✅ Token Created Successfully!`);
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Status: ${tokenCreateReceipt.status}\n`);

    // Step 2: Mint Token
    console.log("🪙 Step 2: Minting VST Tokens...");
    const initialSupply = 100000 * 10 ** 8; // 100,000 tokens with 8 decimals

    const tokenMintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setAmount(initialSupply)
      .setTransactionMemo("Mint initial VST supply");

    const mintResponse = await tokenMintTx.execute(client);
    const mintReceipt = await mintResponse.getReceipt(client);

    console.log(`✅ Tokens Minted Successfully!`);
    console.log(`   Amount Minted: 100,000 VST`);
    console.log(`   Treasury Account: ${treasuryId}`);
    console.log(`   Status: ${mintReceipt.status}\n`);

    // Step 3: Display Token Information
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║   ✅ VST TOKEN MINTING COMPLETED SUCCESSFULLY!   ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    console.log("📊 Token Information:");
    console.log(`   • Token ID: ${tokenId}`);
    console.log(`   • Name: Vistia Token`);
    console.log(`   • Symbol: VST`);
    console.log(`   • Decimals: 8`);
    console.log(`   • Total Supply: 100,000 VST`);
    console.log(`   • Max Supply: 100,000 VST`);
    console.log(`   • Treasury Account: ${treasuryId}`);
    console.log(`   • Supply Type: Finite\n`);

    // Save to environment
    console.log("💾 Update your .env file with:");
    console.log(`   VITE_VST_TOKEN_ID=${tokenId}\n`);

    console.log("🔗 View on Hedera Explorer:");
    console.log(
      `   https://mainnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}\n`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error minting token:");
    console.error(`   Message: ${error.message}`);
    if (error.status) {
      console.error(`   Status: ${error.status}`);
    }
    console.error("\n📋 Troubleshooting:");
    console.error(
      "   - Check that account 0.0.9451398 has sufficient HBAR balance"
    );
    console.error("   - Verify the private key is correct");
    console.error("   - Ensure the network connection is stable\n");
    process.exit(1);
  }
}

// Run the function
mintVSTToken();

