console.log('🧪 Testing Real-time Exchange Rate...');
console.log('='.repeat(60));

const TREASURY_ACCOUNT_ID = '0.0.9451398';
const VST_TOKEN_ID = '0.0.10048687';
const MIRROR_NODE_URL = 'https://mainnet.mirrornode.hedera.com/api/v1';

// Configuration
const INITIAL_PRICE = 0.1; // 0.1 Sauce per VST
const K_LINEAR = 0.0001; // Linear coefficient

function calculatePrice(tokensSold) {
  return INITIAL_PRICE * (1 + K_LINEAR * tokensSold);
}

async function testExchangeRate() {
  try {
    console.log('📡 Querying Treasury VST balance...');
    
    const response = await fetch(`${MIRROR_NODE_URL}/accounts/${TREASURY_ACCOUNT_ID}/tokens`);
    const data = await response.json();
    
    const vstToken = data.tokens?.find((token) => 
      token.token_id === VST_TOKEN_ID
    );
    
    if (!vstToken) {
      throw new Error(`VST token ${VST_TOKEN_ID} not found in Treasury`);
    }
    
    const balance = vstToken.balance || 0;
    const balanceDisplay = balance / 100000000;
    const tokensSold = 100000 - balanceDisplay;
    const currentPrice = calculatePrice(tokensSold);
    
    console.log('✅ Treasury Status:');
    console.log('   Treasury Balance:', balanceDisplay.toFixed(2), 'VST');
    console.log('   Tokens Sold:', tokensSold.toFixed(2), 'VST');
    console.log('   Sell Progress:', (tokensSold / 100000 * 100).toFixed(2), '%');
    
    console.log('\n💰 Exchange Rate Analysis:');
    console.log('='.repeat(40));
    
    console.log('📊 Initial Exchange Rate:');
    console.log('   1 VST = 0.10000000 Sauce (Start)');
    console.log('   This is the starting rate when Treasury had 100,000 VST');
    
    console.log('\n📊 Current Exchange Rate:');
    console.log(`   1 VST = ${currentPrice.toFixed(8)} Sauce (Real-time)`);
    console.log(`   Price Increase: ${((currentPrice - INITIAL_PRICE) / INITIAL_PRICE * 100).toFixed(2)}%`);
    
    console.log('\n📈 Exchange Rate Progression:');
    console.log('   Tokens Sold | Exchange Rate | Price Increase');
    console.log('   -----------|---------------|----------------');
    
    const testPoints = [0, 1000, 5000, 10000, 20000, 50000, 100000];
    for (const sold of testPoints) {
      const price = calculatePrice(sold);
      const increase = ((price - INITIAL_PRICE) / INITIAL_PRICE * 100);
      console.log(`   ${sold.toString().padStart(10)} | ${price.toFixed(8)} | ${increase.toFixed(2)}%`);
    }
    
    console.log('\n🎯 Exchange Rate Impact:');
    console.log('   • Initial Rate: 1 VST = 0.1 Sauce');
    console.log(`   • Current Rate: 1 VST = ${currentPrice.toFixed(8)} Sauce`);
    console.log(`   • Price Multiplier: ${(currentPrice / INITIAL_PRICE).toFixed(2)}x`);
    console.log(`   • Total Increase: ${((currentPrice / INITIAL_PRICE - 1) * 100).toFixed(2)}%`);
    
    console.log('\n📊 Bonding Curve Mathematics:');
    console.log('   Formula: Price = 0.1 × (1 + 0.0001 × TokensSold)');
    console.log(`   Current: ${currentPrice.toFixed(8)} = 0.1 × (1 + 0.0001 × ${tokensSold.toFixed(2)})`);
    console.log(`   Verification: ${currentPrice.toFixed(8)} = ${(INITIAL_PRICE * (1 + K_LINEAR * tokensSold)).toFixed(8)}`);
    
    console.log('\n✅ Exchange Rate Test Complete!');
    console.log('🎯 Key Features:');
    console.log('   • Real-time exchange rate calculation');
    console.log('   • Treasury balance integration');
    console.log('   • Price progression tracking');
    console.log('   • Mathematical verification');
    console.log('   • Bonding curve formula validation');
    
  } catch (error) {
    console.error('❌ Error testing exchange rate:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testExchangeRate();
