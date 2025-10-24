import {
  AccountId,
  Hbar,
  TransferTransaction,
  TokenId,
} from "@hashgraph/sdk";

interface BuyTradeParams {
  buyerAccountId: string;
  vstAmount: number;
  hbarCost: number;
  treasuryAccountId: string;
  vstTokenId: string;
  manager: any;
}

interface SellTradeParams {
  sellerAccountId: string;
  vstAmount: number;
  hbarProceeds: number;
  treasuryAccountId: string;
  vstTokenId: string;
  manager: any;
}

export async function executeBuyTrade(params: BuyTradeParams): Promise<string> {
  try {
    console.log(`🛍️ Starting buy transaction (Step 1: HBAR transfer)...`);
    console.log(`  VST Amount: ${params.vstAmount}`);
    console.log(`  HBAR Cost: ${params.hbarCost}`);
    console.log(`  Buyer: ${params.buyerAccountId}`);
    console.log(`  Treasury: ${params.treasuryAccountId}`);

    if (!params.manager) {
      throw new Error("Manager not provided");
    }

    console.log(`📝 Creating HBAR-only transfer transaction...`);
    const hbarOnlyTx = new TransferTransaction()
      .addHbarTransfer(
        AccountId.fromString(params.buyerAccountId),
        new Hbar(-params.hbarCost)
      )
      .addHbarTransfer(
        AccountId.fromString(params.treasuryAccountId),
        new Hbar(params.hbarCost)
      )
      .setTransactionValidDuration(120)
      .setTransactionMemo(`Bonding Curve Buy: You will receive ${Math.floor(params.vstAmount / 100000000)} VST tokens after this transaction`);

    console.log(`✅ HBAR-only transaction created`);
    console.log(`📤 Sending to HashPack for user signature...`);

    const response = await params.manager.executeTransaction(hbarOnlyTx, params.buyerAccountId);
    
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
      .setTransactionMemo(`Bonding Curve Sell: You will receive ${params.hbarProceeds} HBAR after this transaction`);

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
