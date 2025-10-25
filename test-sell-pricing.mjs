console.log('🧪 Testing VST-Sauce Sell Pricing...');
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

function calculateSellProceeds(tokensToSell, currentTokensSold) {
  const initialPricePerVst = INITIAL_PRICE;
  
  // Calculate proceeds using integral from currentTokensSold to currentTokensSold - tokensToSell
  const startPoint = currentTokensSold;
  const endPoint = Math.max(0, currentTokensSold - tokensToSell);
  
  const firstTerm = initialPricePerVst * tokensToSell;
  const secondTerm = (initialPricePerVst * K_LINEAR * (startPoint ** 2 - endPoint ** 2)) / 2;
  const totalReceived = firstTerm + secondTerm;
  
  const currentPrice = calculatePrice(currentTokensSold);
  const priceImpact = ((currentPrice - INITIAL_PRICE) / INITIAL_PRICE) * 100;
  
  return {
    currentPrice,
    tokensToSell,
    sauceReceived: totalReceived,
    priceImpact
  };
}

async function testSellPricing() {
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
    
    console.log('✅ Treasury Balance:');
    console.log('   Treasury Balance:', balanceDisplay.toFixed(2), 'VST');
    console.log('   Tokens Sold:', tokensSold.toFixed(2), 'VST');
    console.log('   Current Price:', calculatePrice(tokensSold).toFixed(8), 'Sauce per VST');
    
    console.log('\n💰 Testing Sell Pricing:');
    
    // Test different sell amounts
    const sellAmounts = [10, 50, 100, 500, 1000];
    
    for (const amount of sellAmounts) {
      const sellData = calculateSellProceeds(amount, tokensSold);
      console.log(`\n   Selling ${amount} VST:`);
      console.log(`     Sauce Received: ${sellData.sauceReceived.toFixed(8)} Sauce`);
      console.log(`     Average Price: ${(sellData.sauceReceived / amount).toFixed(8)} Sauce per VST`);
      console.log(`     Current Price: ${sellData.currentPrice.toFixed(8)} Sauce per VST`);
      console.log(`     Price Impact: ${sellData.priceImpact.toFixed(2)}%`);
    }
    
    console.log('\n🎯 Sell vs Buy Comparison:');
    const testAmount = 100;
    
    // Buy calculation (forward)
    const buyStartPoint = tokensSold;
    const buyEndPoint = tokensSold + testAmount;
    const buyFirstTerm = INITIAL_PRICE * testAmount;
    const buySecondTerm = (INITIAL_PRICE * K_LINEAR * (buyEndPoint ** 2 - buyStartPoint ** 2)) / 2;
    const buyCost = buyFirstTerm + buySecondTerm;
    
    // Sell calculation (backward)
    const sellData = calculateSellProceeds(testAmount, tokensSold);
    
    console.log(`   For ${testAmount} VST:`);
    console.log(`     Buy Cost: ${buyCost.toFixed(8)} Sauce`);
    console.log(`     Sell Proceeds: ${sellData.sauceReceived.toFixed(8)} Sauce`);
    console.log(`     Difference: ${(buyCost - sellData.sauceReceived).toFixed(8)} Sauce`);
    console.log(`     Spread: ${(((buyCost - sellData.sauceReceived) / buyCost) * 100).toFixed(2)}%`);
    
    console.log('\n✅ Sell Pricing Test Complete!');
    console.log('🎯 Key Features:');
    console.log('   • Real-time Treasury balance integration');
    console.log('   • Backward curve calculation for sells');
    console.log('   • Price impact calculation');
    console.log('   • Buy/sell spread analysis');
    
  } catch (error) {
    console.error('❌ Error testing sell pricing:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testSellPricing();
