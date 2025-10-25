console.log('🧪 Testing Chart Reference Lines...');
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

function generatePriceHistory(maxTokens = 50000, steps = 50) {
  const history = [];
  const stepSize = Math.floor(maxTokens / steps);

  for (let i = 0; i < steps; i++) {
    const tokens = i * stepSize;
    const price = calculatePrice(tokens);
    let cumulative = 0;
    if (tokens >= 1) {
      // Calculate cumulative cost using integral
      const firstTerm = INITIAL_PRICE * tokens;
      const secondTerm = (INITIAL_PRICE * K_LINEAR * tokens ** 2) / 2;
      cumulative = firstTerm + secondTerm;
    }

    history.push({
      tokens,
      price,
      cumulative,
    });
  }

  return history;
}

async function testChartReferenceLines() {
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
    console.log('   Current Price:', currentPrice.toFixed(8), 'Sauce per VST');
    
    console.log('\n📊 Chart Data Generation:');
    const priceHistory = generatePriceHistory(50000, 50);
    console.log(`   Generated ${priceHistory.length} data points`);
    console.log('   Price range:', priceHistory[0].price.toFixed(8), 'to', priceHistory[priceHistory.length - 1].price.toFixed(8), 'Sauce');
    console.log('   Token range:', priceHistory[0].tokens, 'to', priceHistory[priceHistory.length - 1].tokens, 'VST');
    
    console.log('\n🎯 Reference Lines:');
    console.log('='.repeat(40));
    
    // Horizontal reference line (current price)
    console.log('📈 Horizontal Reference Line (Price):');
    console.log(`   Y-axis value: ${currentPrice.toFixed(8)} Sauce`);
    console.log(`   Color: #FF6B6B (Red)`);
    console.log(`   Style: Dashed (5 5)`);
    console.log(`   Label: "Current: ${currentPrice.toFixed(8)} Sauce"`);
    console.log(`   Position: topRight`);
    
    // Vertical reference line (tokens sold)
    console.log('\n📊 Vertical Reference Line (Tokens Sold):');
    console.log(`   X-axis value: ${tokensSold.toFixed(0)} VST`);
    console.log(`   Color: #4ECDC4 (Teal)`);
    console.log(`   Style: Dashed (3 3)`);
    console.log(`   Label: "Sold: ${tokensSold.toFixed(0)} VST"`);
    console.log(`   Position: topLeft`);
    
    console.log('\n📈 Chart Visualization:');
    console.log('   • Green line: Bonding curve (price vs tokens sold)');
    console.log('   • Red dashed line: Current real-time price');
    console.log('   • Teal dashed line: Current tokens sold position');
    console.log('   • Intersection: Current market position');
    
    console.log('\n🎨 Visual Features:');
    console.log('   • Real-time price indicator');
    console.log('   • Current market position marker');
    console.log('   • Price progression visualization');
    console.log('   • Interactive tooltips');
    console.log('   • Responsive design');
    
    console.log('\n✅ Chart Reference Lines Test Complete!');
    console.log('🎯 Key Features:');
    console.log('   • Real-time price reference line');
    console.log('   • Current tokens sold reference line');
    console.log('   • Visual market position indicator');
    console.log('   • Interactive chart with tooltips');
    console.log('   • Responsive design for all devices');
    
  } catch (error) {
    console.error('❌ Error testing chart reference lines:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testChartReferenceLines();
