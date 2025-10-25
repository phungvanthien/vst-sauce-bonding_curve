import { Client, PrivateKey, AccountId, TokenId, AccountInfoQuery } from '@hashgraph/sdk';

console.log('🔍 Checking KYC Status for VST Token...');
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

async function checkKYCStatus() {
  try {
    console.log('📡 Checking VST token KYC configuration...');
    
    // Check if token has KYC key
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(client);

    console.log('✅ VST Token Info:');
    console.log('   Token ID:', tokenInfo.tokenId.toString());
    console.log('   Name:', tokenInfo.name);
    console.log('   Symbol:', tokenInfo.symbol);
    console.log('   KYC Key:', tokenInfo.kycKey ? 'SET' : 'NOT SET');
    console.log('   Default KYC Status:', tokenInfo.defaultKycStatus);
    
    if (tokenInfo.kycKey) {
      console.log('   ⚠️  KYC Key is SET - This means KYC is required!');
      console.log('   🔧 Solution: Disable KYC requirements for the token');
    } else {
      console.log('   ✅ KYC Key is NOT SET - KYC is not required');
    }

    console.log('');
    console.log('🛠️  Recommended Actions:');
    if (tokenInfo.kycKey) {
      console.log('   1. Disable KYC requirements for VST token');
      console.log('   2. Set KYC key to null');
      console.log('   3. This will allow all accounts to use the token');
    } else {
      console.log('   ✅ KYC is already disabled - no action needed');
    }

  } catch (error) {
    console.error('❌ Error checking KYC status:', error.message);
    console.error('   Details:', error);
  }
}

// Run the check
checkKYCStatus();
