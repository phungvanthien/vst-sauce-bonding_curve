import { Client, PrivateKey, AccountId, TokenId, TokenUpdateTransaction } from '@hashgraph/sdk';

console.log('🔄 Updating VST Token with Direct Logo URL...');
console.log('='.repeat(60));

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

async function updateVSTWithDirectLogo() {
  try {
    console.log('📝 Updating VST token with direct logo URL...');
    
    // VST Token metadata with direct logo URL
    const tokenName = 'VST Token';
    const tokenSymbol = 'VST';
    const tokenMemo = `VST Token for Bonding Curve Trading - Deflationary token with burn mechanism. Logo: https://raw.githubusercontent.com/phungvanthien/vst-sauce-bonding_curve/main/vst-assets/logo-512.png`;
    
    console.log('📡 Creating token update transaction...');
    const updateTransaction = new TokenUpdateTransaction()
      .setTokenId(tokenId)
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenMemo(tokenMemo)
      .setTransactionMemo('VST Token Update - Direct Logo URL in Memo');

    console.log('🔒 Freezing and signing transaction...');
    const frozenTx = await updateTransaction.freezeWith(client);
    const signedTx = await frozenTx.sign(treasuryKey);

    console.log('📤 Executing transaction...');
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status.toString() === 'SUCCESS') {
      console.log('✅ VST Token updated with direct logo URL successfully!');
      console.log('   Transaction ID:', txResponse.transactionId.toString());
      console.log('   Token ID:', VST_TOKEN_ID);
      console.log('   Name:', tokenName);
      console.log('   Symbol:', tokenSymbol);
      console.log('   Memo with Logo URL:', tokenMemo);
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('   1. Wait 5-10 minutes for changes to propagate');
      console.log('   2. Remove VST token from HashPack wallet');
      console.log('   3. Re-add VST token (ID: 0.0.10048687)');
      console.log('   4. Check if logo appears');
      console.log('');
      console.log('📱 HashPack Steps:');
      console.log('   - Go to Tokens section');
      console.log('   - Find VST token and remove it');
      console.log('   - Click "Add Token"');
      console.log('   - Enter: 0.0.10048687');
      console.log('   - Add token again');
      console.log('   - Logo should appear');
    } else {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

  } catch (error) {
    console.error('❌ Error updating VST token:', error.message);
    console.error('   Details:', error);
  }
}

// Run the update
updateVSTWithDirectLogo();
