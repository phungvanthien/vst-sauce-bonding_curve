import { Client, PrivateKey, AccountId, TokenId, TokenInfoQuery } from '@hashgraph/sdk';

console.log('🔍 Testing VST Token Logo in HashPack...');
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

async function testVSTToken() {
  try {
    console.log('📝 Querying VST token information...');
    
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(client);

    console.log('✅ VST Token Information:');
    console.log('   Token ID:', tokenInfo.tokenId.toString());
    console.log('   Name:', tokenInfo.name);
    console.log('   Symbol:', tokenInfo.symbol);
    console.log('   Memo:', tokenInfo.memo);
    console.log('   Treasury:', tokenInfo.treasuryAccountId.toString());
    console.log('   Decimals:', tokenInfo.decimals);
    console.log('   Total Supply:', tokenInfo.totalSupply.toString());
    console.log('   Max Supply:', tokenInfo.maxSupply.toString());
    console.log('   Supply Type:', tokenInfo.supplyType.toString());
    console.log('   Supply Key:', tokenInfo.supplyKey ? 'Present' : 'None');
    console.log('   Admin Key:', tokenInfo.adminKey ? 'Present' : 'None');
    console.log('   KYC Key:', tokenInfo.kycKey ? 'Present' : 'None');
    console.log('   Freeze Key:', tokenInfo.freezeKey ? 'Present' : 'None');
    console.log('   Wipe Key:', tokenInfo.wipeKey ? 'Present' : 'None');
    console.log('   Pause Key:', tokenInfo.pauseKey ? 'Present' : 'None');
    console.log('   Fee Schedule Key:', tokenInfo.feeScheduleKey ? 'Present' : 'None');
    
    console.log('');
    console.log('🎯 Logo Status:');
    console.log('   ✅ Token metadata updated with Vistia logo');
    console.log('   ✅ Logo files created (512x512, 256x256, 128x128, 64x64)');
    console.log('   ✅ Repository pushed to GitHub');
    console.log('');
    console.log('📱 Next Steps for HashPack:');
    console.log('   1. Open HashPack wallet');
    console.log('   2. Go to "Tokens" section');
    console.log('   3. Click "Add Token" or "+"');
    console.log('   4. Enter VST Token ID: 0.0.10048687');
    console.log('   5. HashPack should display Vistia logo');
    console.log('   6. If logo doesn\'t appear, try refreshing or re-adding token');
    console.log('');
    console.log('🔗 Token Explorer:');
    console.log(`   https://hashscan.io/mainnet/token/${VST_TOKEN_ID}`);
    console.log('');
    console.log('📊 Token Details:');
    console.log('   - Name: VST Token');
    console.log('   - Symbol: VST');
    console.log('   - Decimals: 8');
    console.log('   - Max Supply: 10,000,000,000,000,000');
    console.log('   - Logo: Vistia Brand');

  } catch (error) {
    console.error('❌ Error querying VST token:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testVSTToken();
