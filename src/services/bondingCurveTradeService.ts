import {
  AccountId,
  Hbar,
  TransferTransaction,
  TokenId,
} from "@hashgraph/sdk";

interface BuyTradeParams {
  buyerAccountId: string;
  vstAmount: number;
  sauceCost: number;
  treasuryAccountId: string;
  vstTokenId: string;
  sauceTokenId: string;
  manager: any;
}

interface SellTradeParams {
  sellerAccountId: string;
  vstAmount: number;
  sauceProceeds: number;
  treasuryAccountId: string;
  vstTokenId: string;
  sauceTokenId: string;
  manager: any;
}

export async function executeBuyTrade(params: BuyTradeParams): Promise<string> {
  try {
    console.log(`🛍️ Starting buy transaction (Step 1: Sauce transfer)...`);
    console.log(`  VST Amount: ${params.vstAmount}`);
    console.log(`  Sauce Cost: ${params.sauceCost}`);
    console.log(`  Buyer: ${params.buyerAccountId}`);
    console.log(`  Treasury: ${params.treasuryAccountId}`);

    if (!params.manager) {
      throw new Error("Manager not provided");
    }

    console.log(`📝 Creating Sauce-only transfer transaction...`);
    const sauceOnlyTx = new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(params.sauceTokenId),
        AccountId.fromString(params.buyerAccountId),
        -Math.floor(params.sauceCost * 1000000) // Convert to raw units (6 decimals)
      )
      .addTokenTransfer(
        TokenId.fromString(params.sauceTokenId),
        AccountId.fromString(params.treasuryAccountId),
        Math.floor(params.sauceCost * 1000000) // Convert to raw units (6 decimals)
      )
      .setTransactionValidDuration(120)
      .setTransactionMemo(`Bonding Curve Buy: You will receive ${Math.floor(params.vstAmount / 100000000)} VST tokens after this transaction`);

    console.log(`✅ Sauce-only transaction created`);
    console.log(`📤 Sending to HashPack for user signature...`);

    const response = await params.manager.executeTransaction(sauceOnlyTx, params.buyerAccountId);
    
    console.log(`✅ Transaction response received:`, response);

    if (!response) {
      throw new Error("No response from transaction execution");
    }

    let txId = response;
    if (typeof response === 'object' && response.transactionId) {
      txId = response.transactionId;
    } else if (typeof response === 'object' && response.response && response.response.transactionId) {
      txId = response.response.transactionId;
    } else if (typeof response === 'string') {
      txId = response;
    }

    const txIdStr = String(txId);
    console.log(`✅ STEP 1 COMPLETE: HBAR transferred to treasury`);
    console.log(`   Transaction ID: ${txIdStr}`);
    
    return txIdStr;
  } catch (error) {
    console.error("❌ Buy transaction failed:", error);
    throw error;
  }
}

export async function executeSellTrade(params: SellTradeParams): Promise<string> {
  try {
    console.log(`💵 Starting sell transaction (Step 1: VST burn)...`);
    console.log(`  VST Amount: ${params.vstAmount}`);
    console.log(`  HBAR Proceeds: ${params.hbarProceeds}`);
    console.log(`  Seller: ${params.sellerAccountId}`);
    console.log(`  Treasury: ${params.treasuryAccountId}`);

    if (!params.manager) {
      throw new Error("Manager not provided");
    }

    console.log(`📝 Creating VST-only transfer transaction...`);
    const vstOnlyTx = new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(params.vstTokenId),
        AccountId.fromString(params.sellerAccountId),
        -params.vstAmount
      )
      .addTokenTransfer(
        TokenId.fromString(params.vstTokenId),
        AccountId.fromString(params.treasuryAccountId),
        params.vstAmount
      )
      .setTransactionValidDuration(120)
      .setTransactionMemo(`Bonding Curve Sell: You will receive ${params.sauceProceeds} Sauce after this transaction`);

    console.log(`✅ VST-only transaction created`);
    console.log(`📤 Sending to HashPack for user signature...`);

    const response = await params.manager.executeTransaction(vstOnlyTx, params.sellerAccountId);
    
    console.log(`✅ Transaction response received:`, response);

    if (!response) {
      throw new Error("No response from transaction execution");
    }

    let txId = response;
    if (typeof response === 'object' && response.transactionId) {
      txId = response.transactionId;
    } else if (typeof response === 'object' && response.response && response.response.transactionId) {
      txId = response.response.transactionId;
    } else if (typeof response === 'string') {
      txId = response;
    }

    const txIdStr = String(txId);
    console.log(`✅ STEP 1 COMPLETE: VST burned from seller`);
    console.log(`   Transaction ID: ${txIdStr}`);
    
    return txIdStr;
  } catch (error) {
    console.error("❌ Sell transaction failed:", error);
    throw error;
  }
}

export function getTradeErrorMessage(error: any): string {
  const errorStr = error?.toString() || "";
  const errorMessage = error?.message || "";
  
  if (errorStr.includes("USER_REJECT") || errorMessage.includes("USER_REJECT")) {
    return "Transaction rejected. Please approve in HashPack wallet.";
  }
  if (errorStr.includes("TRANSACTION_EXPIRED")) {
    return "Transaction expired. Please try again.";
  }
  if (errorStr.includes("list is locked")) {
    return "Transaction preparation issue. Please try again.";
  }
  return "Transaction failed: " + errorMessage.substring(0, 100);
}
