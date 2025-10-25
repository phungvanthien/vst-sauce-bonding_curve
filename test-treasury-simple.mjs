console.log('🧪 Testing Treasury Balance Query...');
console.log('='.repeat(60));

const TREASURY_ACCOUNT_ID = '0.0.9451398';
const VST_TOKEN_ID = '0.0.10048687';
const MIRROR_NODE_URL = 'https://mainnet.mirrornode.hedera.com/api/v1';

async function testTreasuryBalance() {
  try {
    console.log('📡 Querying Treasury VST balance...');
    console.log(`   Treasury: ${TREASURY_ACCOUNT_ID}`);
    console.log(`   Token: ${VST_TOKEN_ID}`);
    
    const response = await fetch(`${MIRROR_NODE_URL}/accounts/${TREASURY_ACCOUNT_ID}/tokens`);
    
    if (!response.ok) {
      throw new Error(`Mirror node request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Treasury tokens data received');
    
    // Find VST token in the list
    const vstToken = data.tokens?.find((token) => 
      token.token_id === VST_TOKEN_ID
    );
    
    if (!vstToken) {
      throw new Error(`VST token ${VST_TOKEN_ID} not found in Treasury`);
    }
    
    const balance = vstToken.balance || 0;
    const balanceDisplay = balance / 100000000; // Convert from raw to display (8 decimals)
    const tokensSold = 100000 - balanceDisplay; // 100,000 initial - current balance
    
    console.log('✅ Treasury Balance Retrieved:');
    console.log('   Raw Balance:', balance);
    console.log('   Display Balance:', balanceDisplay.toFixed(2), 'VST');
    console.log('   Tokens Sold:', tokensSold.toFixed(2), 'VST');
    
    console.log('\n🎯 Bonding Curve Calculation:');
    const initialSupply = 100000;
    const sellPercentage = (tokensSold / initialSupply) * 100;
    
    console.log('   Initial Supply:', initialSupply.toFixed(2), 'VST');
    console.log('   Tokens Sold:', tokensSold.toFixed(2), 'VST');
    console.log('   Tokens Remaining:', balanceDisplay.toFixed(2), 'VST');
    console.log('   Sell Progress:', sellPercentage.toFixed(2), '%');
    
    // Calculate bonding curve price
    const initialPrice = 0.1; // 0.1 Sauce per VST
    const kLinear = 0.0001; // Linear coefficient
    const currentPrice = initialPrice * (1 + kLinear * tokensSold);
    
    console.log('\n💰 Bonding Curve Pricing:');
    console.log('   Initial Price:', initialPrice.toFixed(8), 'Sauce per VST');
    console.log('   Current Price:', currentPrice.toFixed(8), 'Sauce per VST');
    console.log('   Price Increase:', ((currentPrice - initialPrice) / initialPrice * 100).toFixed(2), '%');
    
    console.log('\n✅ Treasury Balance Test Complete!');
    console.log('🎯 Key Features:');
    console.log('   • Real-time Treasury balance query');
    console.log('   • Automatic tokens sold calculation');
    console.log('   • Bonding curve price calculation');
    console.log('   • Sell progress tracking');
    
  } catch (error) {
    console.error('❌ Error testing Treasury balance:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testTreasuryBalance();
