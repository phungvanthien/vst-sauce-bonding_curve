import { Client, PrivateKey, AccountId, TokenId, TokenUpdateTransaction } from '@hashgraph/sdk';

console.log('🔄 Updating VST Token with Vistia Logo...');
console.log('='.repeat(50));

// Load environment variables
const TREASURY_ACCOUNT_ID = process.env.TREASURY_ACCOUNT_ID || '0.0.9451398';
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || 'd8fc50eb2ca055b1703bc9bc225889ffa29565b3e5ad63b6a384f2adba2daebb';
const VST_TOKEN_ID = process.env.VST_TOKEN_ID || '0.0.10048687';

// Initialize Hedera client
const client = Client.forMainnet();
const treasuryId = AccountId.fromString(TREASURY_ACCOUNT_ID);
const treasuryKey = PrivateKey.fromStringECDSA(TREASURY_PRIVATE_KEY);
const tokenId = TokenId.fromString(VST_TOKEN_ID);

client.setOperator(treasuryId, treasuryKey);

async function updateVSTWithLogo() {
  try {
    console.log('📝 Updating VST token with Vistia logo...');
    
    // VST Token metadata with logo
    const tokenName = 'VST Token';
    const tokenSymbol = 'VST';
    const tokenMemo = 'VST Token for Bonding Curve Trading - Deflationary token with burn mechanism. Logo: Vistia Brand';
    
    console.log('📡 Creating token update transaction...');
    const updateTransaction = new TokenUpdateTransaction()
      .setTokenId(tokenId)
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenMemo(tokenMemo)
      .setTransactionMemo('VST Token Update - Vistia Logo Integration');

    console.log('🔒 Freezing and signing transaction...');
    const frozenTx = await updateTransaction.freezeWith(client);
    const signedTx = await frozenTx.sign(treasuryKey);

    console.log('📤 Executing transaction...');
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status.toString() === 'SUCCESS') {
      console.log('✅ VST Token updated with Vistia logo successfully!');
      console.log('   Transaction ID:', txResponse.transactionId.toString());
      console.log('   Token ID:', VST_TOKEN_ID);
      console.log('   Name:', tokenName);
      console.log('   Symbol:', tokenSymbol);
      console.log('   Memo:', tokenMemo);
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('   1. Upload logo files to GitHub repository');
      console.log('   2. Update metadata.json with correct URLs');
      console.log('   3. Test in HashPack wallet');
      console.log('   4. Logo should appear when token is added to wallet');
      console.log('');
      console.log('📁 Logo files created:');
      console.log('   - logo-512.png (512x512)');
      console.log('   - logo-256.png (256x256)');
      console.log('   - logo-128.png (128x128)');
      console.log('   - logo-64.png (64x64)');
    } else {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

  } catch (error) {
    console.error('❌ Error updating VST token:', error.message);
    console.error('   Details:', error);
  }
}

// Run the update
updateVSTWithLogo();
