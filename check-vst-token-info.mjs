import { Client, PrivateKey, AccountId, TokenId, TokenInfoQuery } from '@hashgraph/sdk';

console.log('🔍 Checking VST Token Info...');
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

async function checkVSTTokenInfo() {
  try {
    console.log('📡 Querying VST token information...');
    
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(client);

    console.log('✅ VST Token Information:');
    console.log('   Token ID:', tokenInfo.tokenId.toString());
    console.log('   Name:', tokenInfo.name);
    console.log('   Symbol:', tokenInfo.symbol);
    console.log('   Decimals:', tokenInfo.decimals);
    console.log('   Total Supply:', tokenInfo.totalSupply.toString());
    console.log('   Treasury:', tokenInfo.treasuryAccountId.toString());
    console.log('   Memo:', tokenInfo.tokenMemo);
    console.log('   Admin Key:', tokenInfo.adminKey ? 'Set' : 'Not set');
    console.log('   KYC Key:', tokenInfo.kycKey ? 'Set' : 'Not set');
    console.log('   Freeze Key:', tokenInfo.freezeKey ? 'Set' : 'Not set');
    console.log('   Supply Key:', tokenInfo.supplyKey ? 'Set' : 'Not set');
    console.log('   Wipe Key:', tokenInfo.wipeKey ? 'Set' : 'Not set');
    console.log('   Pause Key:', tokenInfo.pauseKey ? 'Set' : 'Not set');
    console.log('   Fee Schedule Key:', tokenInfo.feeScheduleKey ? 'Set' : 'Not set');
    console.log('   Custom Fees:', tokenInfo.customFees.length > 0 ? 'Set' : 'Not set');
    console.log('   Token Type:', tokenInfo.tokenType);
    console.log('   Supply Type:', tokenInfo.supplyType);
    console.log('   Max Supply:', tokenInfo.maxSupply.toString());
    console.log('   Default Freeze Status:', tokenInfo.defaultFreezeStatus);
    console.log('   Default KYC Status:', tokenInfo.defaultKycStatus);
    console.log('   Auto Renew Account:', tokenInfo.autoRenewAccountId ? tokenInfo.autoRenewAccountId.toString() : 'Not set');
    console.log('   Auto Renew Period:', tokenInfo.autoRenewPeriod);
    console.log('   Expiry:', tokenInfo.expiryTime);
    console.log('   Ledger ID:', tokenInfo.ledgerId);
    console.log('   Created Timestamp:', tokenInfo.createdTimestamp);
    console.log('   Modified Timestamp:', tokenInfo.modifiedTimestamp);
    
    console.log('');
    console.log('🔗 Explorer Links:');
    console.log('   HashScan: https://hashscan.io/mainnet/token/' + VST_TOKEN_ID);
    console.log('   Hedera Explorer: https://hederaexplorer.io/token/' + VST_TOKEN_ID);
    
    console.log('');
    console.log('📱 HashPack Troubleshooting:');
    console.log('   1. Try removing and re-adding the token');
    console.log('   2. Clear HashPack cache and restart');
    console.log('   3. Check if token is properly associated');
    console.log('   4. Wait a few minutes for changes to propagate');
    
  } catch (error) {
    console.error('❌ Error checking VST token:', error.message);
    console.error('   Details:', error);
  }
}

// Run the check
checkVSTTokenInfo();
