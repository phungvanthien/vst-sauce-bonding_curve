import { AccountId, TokenAssociateTransaction, TokenId } from "@hashgraph/sdk";

/**
 * Token Association Service
 * Handles associating tokens to wallets using Hedera SDK through HashConnect
 */

/**
 * Associates a token with a wallet account
 * @param tokenId - Token ID to associate (e.g., "0.0.10048687")
 * @param accountId - Account ID to associate token to (e.g., "0.0.123456")
 * @param manager - HashConnect manager object that can execute transactions
 * @returns Transaction ID of the association
 */
export async function associateToken(
  tokenId: string,
  accountId: string,
  manager: any
): Promise<string> {
  try {
    console.log(`🔄 Starting token association...`);
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Account ID: ${accountId}`);
    console.log(`  Manager: ${manager ? "Available" : "Not available"}`);

    // Validate inputs
    if (!tokenId || !accountId || !manager) {
      throw new Error("Missing required parameters: tokenId, accountId, or manager");
    }

    // Create the token association transaction
    console.log(`📝 Creating TokenAssociateTransaction...`);
    const transaction = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .addTokenId(TokenId.fromString(tokenId));

    console.log(`✅ Transaction created`);
    console.log(`📤 Sending to HashPack for signing...`);

    // Execute the transaction via HashConnect manager
    // This will open HashPack for user approval
    const response = await manager.executeTransaction(transaction, accountId);
    
    console.log(`✅ Transaction response:`, response);

    if (!response) {
      throw new Error("No response from transaction execution");
    }

    // Extract transaction ID from response
    let txId = response;
    if (typeof response === 'object' && response.transactionId) {
      txId = response.transactionId;
    }
    if (typeof response === 'object' && response.response && response.response.transactionId) {
      txId = response.response.transactionId;
    }

    console.log(`✅ Token associated successfully!`);
    console.log(`   Transaction ID: ${txId}`);
    
    return String(txId);
  } catch (error) {
    console.error("❌ Token association failed:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Checks if an account has a token association
 * @param accountId - Account ID to check
 * @param tokenId - Token ID to check for
 * @returns Boolean indicating if token is associated
 */
export async function isTokenAssociated(
  accountId: string,
  tokenId: string
): Promise<boolean> {
  try {
    // This is a placeholder - actual implementation would query the mirror node
    console.log(`Checking association for ${tokenId} on ${accountId}`);
    return true;
  } catch (error) {
    console.error("Error checking token association:", error);
    return false;
  }
}

/**
 * Gets user-friendly error message for association errors
 */
export function getAssociationErrorMessage(error: any): string {
  const errorStr = error?.toString() || "";
  
  console.log("Processing error:", errorStr);
  
  if (errorStr.includes("TOKEN_ALREADY_ASSOCIATED")) {
    return "Token is already associated with this account";
  }
  if (errorStr.includes("INVALID_ACCOUNT_ID")) {
    return "Invalid account ID - please reconnect your wallet";
  }
  if (errorStr.includes("INVALID_TOKEN_ID")) {
    return "Invalid token ID (0.0.10048687)";
  }
  if (errorStr.includes("INSUFFICIENT_ACCOUNT_BALANCE") || errorStr.includes("INSUFFICIENT_TX_FEE")) {
    return "Insufficient HBAR balance for transaction fee";
  }
  if (errorStr.includes("USER_REJECTED")) {
    return "Transaction rejected in HashPack wallet";
  }
  if (errorStr.includes("TRANSACTION_REJECTED")) {
    return "Transaction was rejected by the network";
  }
  if (errorStr.includes("request_signature_rejected")) {
    return "You rejected the transaction in your wallet";
  }
  if (errorStr.includes("Missing required parameters")) {
    return "Missing wallet information. Please reconnect your wallet.";
  }
  
  return "Failed to associate token: " + errorStr.substring(0, 150);
}
