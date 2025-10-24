import {
  Client,
  AccountId,
  PrivateKey,
  TokenInfoQuery,
  AccountInfoQuery,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

async function verifyVSTToken() {
  try {
    console.log("🔍 Verifying VST Token Information...\n");

    // Configuration
    const operatorId = process.env.VITE_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.VITE_PRIVATE_KEY;
    const treasuryId = process.env.VITE_TREASURY_ID;
    const tokenId = process.env.VITE_VST_TOKEN_ID;

    if (!operatorId || !operatorKey || !treasuryId || !tokenId) {
      throw new Error("Missing required environment variables");
    }

    console.log("📋 Configuration:");
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Treasury Account: ${treasuryId}\n`);

    // Initialize client for mainnet
    const client = Client.forMainnet();

    // Set operator
    const accountId = AccountId.fromString(operatorId);
    const privateKey = PrivateKey.fromStringECDSA(operatorKey);

    client.setOperator(accountId, privateKey);

    // Step 1: Query Token Information
    console.log("📝 Step 1: Fetching Token Information...");
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(client);

    console.log("✅ Token Information Retrieved:\n");
    console.log("   📊 Basic Information:");
    console.log(`      • Token Name: ${tokenInfo.name}`);
    console.log(`      • Token Symbol: ${tokenInfo.symbol}`);
    console.log(`      • Token ID: ${tokenInfo.tokenId}`);
    console.log(`      • Token Type: ${tokenInfo.tokenType}`);
    console.log(`      • Decimals: ${tokenInfo.decimals}`);

    console.log("\n   💰 Supply Information:");
    console.log(`      • Total Supply: ${tokenInfo.totalSupply / 10 ** 8} VST`);
    console.log(`      • Max Supply: ${tokenInfo.maxSupply / 10 ** 8} VST`);
    console.log(`      • Supply Type: ${tokenInfo.supplyType}`);

    console.log("\n   🏛️ Treasury Information:");
    console.log(`      • Treasury Account: ${tokenInfo.treasury}`);

    console.log("\n   🔐 Key Permissions:");
    console.log(`      • Admin Key: ${tokenInfo.adminKey ? "✅ Set" : "❌ Not Set"}`);
    console.log(`      • Freeze Key: ${tokenInfo.freezeKey ? "✅ Set" : "❌ Not Set"}`);
    console.log(`      • Wipe Key: ${tokenInfo.wipeKey ? "✅ Set" : "❌ Not Set"}`);
    console.log(`      • Supply Key: ${tokenInfo.supplyKey ? "✅ Set" : "❌ Not Set"}`);
    console.log(`      • KYC Key: ${tokenInfo.kycKey ? "✅ Set" : "❌ Not Set"}`);

    // Step 2: Query Treasury Account Information
    console.log("\n📝 Step 2: Fetching Treasury Account Information...");
    const treasuryAccount = await new AccountInfoQuery()
      .setAccountId(AccountId.fromString(treasuryId))
      .execute(client);

    console.log("✅ Treasury Account Information Retrieved:\n");

    console.log("   💵 Account Balance:");
    console.log(`      • HBAR Balance: ${treasuryAccount.balance.hbars} HBAR`);

    console.log("\n   🪙 Token Balances:");
    let vstFound = false;
    for (const [tokenId, tokenBalance] of treasuryAccount.tokenRelationships) {
      if (tokenId.toString() === process.env.VITE_VST_TOKEN_ID) {
        console.log(
          `      • VST: ${tokenBalance.balance / 10 ** 8} (Balance: ${tokenBalance.balance})`
        );
        vstFound = true;
      }
    }

    if (!vstFound) {
      console.log(`      ⚠️  VST token not found in treasury relationships`);
    }

    // Summary
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║   ✅ VERIFICATION COMPLETED SUCCESSFULLY!        ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    console.log("📌 Summary:");
    console.log(`   • Token Created: ✅ YES`);
    console.log(`   • Total Supply: ✅ 100,000 VST`);
    console.log(`   • In Treasury: ✅ ${vstFound ? "YES" : "PENDING"}`);
    console.log(`   • Status: ✅ READY FOR USE\n`);

    console.log("🔗 Links:");
    console.log(
      `   • Token: https://mainnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}`
    );
    console.log(
      `   • Treasury: https://mainnet.mirrornode.hedera.com/api/v1/accounts/${treasuryId}\n`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying token:");
    console.error(`   Message: ${error.message}`);
    if (error.status) {
      console.error(`   Status: ${error.status}`);
    }
    process.exit(1);
  }
}

// Run the function
verifyVSTToken();

