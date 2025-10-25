console.log('🧪 Testing VST-Sauce Buy vs Sell Pricing...');
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

function calculateBuyCost(tokensToBuy, currentTokensSold) {
  const initialPricePerVst = INITIAL_PRICE;
  const startPoint = currentTokensSold;
  const endPoint = currentTokensSold + tokensToBuy;
  
  const firstTerm = initialPricePerVst * tokensToBuy;
  const secondTerm = (initialPricePerVst * K_LINEAR * (endPoint ** 2 - startPoint ** 2)) / 2;
  const totalCost = firstTerm + secondTerm;
  
  const currentPrice = calculatePrice(endPoint);
  const averagePrice = totalCost / tokensToBuy;
  const priceImpact = ((currentPrice - INITIAL_PRICE) / INITIAL_PRICE) * 100;
  
  return {
    currentPrice,
    averagePrice,
    tokensToBuy,
    totalCost,
    priceImpact
  };
}

function calculateSellProceeds(tokensToSell, currentTokensSold) {
  const initialPricePerVst = INITIAL_PRICE;
  const startPoint = currentTokensSold;
  const endPoint = Math.max(0, currentTokensSold - tokensToSell);
  
  const firstTerm = initialPricePerVst * tokensToSell;
  const secondTerm = (initialPricePerVst * K_LINEAR * (startPoint ** 2 - endPoint ** 2)) / 2;
  const totalReceived = firstTerm + secondTerm;
  
  const currentPrice = calculatePrice(currentTokensSold);
  const averagePrice = totalReceived / tokensToSell;
  const priceImpact = ((currentPrice - INITIAL_PRICE) / INITIAL_PRICE) * 100;
  
  return {
    currentPrice,
    averagePrice,
    tokensToSell,
    sauceReceived: totalReceived,
    priceImpact
  };
}

async function testBuySellComparison() {
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
    
    console.log('✅ Treasury Status:');
    console.log('   Treasury Balance:', balanceDisplay.toFixed(2), 'VST');
    console.log('   Tokens Sold:', tokensSold.toFixed(2), 'VST');
    console.log('   Current Price:', calculatePrice(tokensSold).toFixed(8), 'Sauce per VST');
    console.log('   Sell Progress:', (tokensSold / 100000 * 100).toFixed(2), '%');
    
    console.log('\n💰 Buy vs Sell Comparison:');
    console.log('='.repeat(40));
    
    const testAmounts = [10, 50, 100, 500];
    
    for (const amount of testAmounts) {
      console.log(`\n📊 Testing ${amount} VST:`);
      
      // Buy calculation
      const buyData = calculateBuyCost(amount, tokensSold);
      console.log(`   BUY:`);
      console.log(`     Cost: ${buyData.totalCost.toFixed(8)} Sauce`);
      console.log(`     Average Price: ${buyData.averagePrice.toFixed(8)} Sauce per VST`);
      console.log(`     Price Impact: ${buyData.priceImpact.toFixed(2)}%`);
      
      // Sell calculation
      const sellData = calculateSellProceeds(amount, tokensSold);
      console.log(`   SELL:`);
      console.log(`     Proceeds: ${sellData.sauceReceived.toFixed(8)} Sauce`);
      console.log(`     Average Price: ${sellData.averagePrice.toFixed(8)} Sauce per VST`);
      console.log(`     Price Impact: ${sellData.priceImpact.toFixed(2)}%`);
      
      // Spread calculation
      const spread = buyData.totalCost - sellData.sauceReceived;
      const spreadPercentage = (spread / buyData.totalCost) * 100;
      console.log(`   SPREAD:`);
      console.log(`     Difference: ${spread.toFixed(8)} Sauce`);
      console.log(`     Spread: ${spreadPercentage.toFixed(2)}%`);
    }
    
    console.log('\n🎯 Bonding Curve Analysis:');
    console.log('='.repeat(40));
    
    // Simulate multiple transactions
    let currentTokensSold = tokensSold;
    console.log(`\n📈 Simulating 5 consecutive buys of 100 VST each:`);
    
    for (let i = 1; i <= 5; i++) {
      const buyData = calculateBuyCost(100, currentTokensSold);
      console.log(`   Buy ${i}: ${buyData.totalCost.toFixed(8)} Sauce (avg: ${buyData.averagePrice.toFixed(8)} Sauce/VST)`);
      currentTokensSold += 100;
    }
    
    console.log(`\n📉 Simulating 3 consecutive sells of 100 VST each:`);
    for (let i = 1; i <= 3; i++) {
      const sellData = calculateSellProceeds(100, currentTokensSold);
      console.log(`   Sell ${i}: ${sellData.sauceReceived.toFixed(8)} Sauce (avg: ${sellData.averagePrice.toFixed(8)} Sauce/VST)`);
      currentTokensSold -= 100;
    }
    
    console.log('\n✅ Buy vs Sell Comparison Test Complete!');
    console.log('🎯 Key Features:');
    console.log('   • Real-time Treasury balance integration');
    console.log('   • Forward curve calculation for buys');
    console.log('   • Backward curve calculation for sells');
    console.log('   • Buy/sell spread analysis');
    console.log('   • Price impact tracking');
    console.log('   • Transaction simulation');
    
  } catch (error) {
    console.error('❌ Error testing buy/sell comparison:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testBuySellComparison();
