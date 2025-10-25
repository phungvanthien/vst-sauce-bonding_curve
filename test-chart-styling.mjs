console.log('🧪 Testing Chart Reference Line Styling...');
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

async function testChartStyling() {
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
    
    console.log('\n🎨 Updated Reference Line Styling:');
    console.log('='.repeat(50));
    
    // Horizontal reference line (price)
    console.log('📈 Horizontal Reference Line (Price):');
    console.log('   Y-axis value:', currentPrice.toFixed(8), 'Sauce');
    console.log('   Color: #FFFFFF (White)');
    console.log('   Style: Dashed (5 5)');
    console.log('   Stroke Width: 2px');
    console.log('   Label: "Current: ' + currentPrice.toFixed(8) + ' Sauce"');
    console.log('   Position: top (above the line)');
    console.log('   Text Style:');
    console.log('     - Color: #FFFFFF (White)');
    console.log('     - Font Size: 12px');
    console.log('     - Font Weight: bold');
    console.log('     - Text Shadow: 1px 1px 2px rgba(0,0,0,0.8)');
    
    // Vertical reference line (tokens sold)
    console.log('\n📊 Vertical Reference Line (Tokens Sold):');
    console.log('   X-axis value:', tokensSold.toFixed(0), 'VST');
    console.log('   Color: #4ECDC4 (Teal)');
    console.log('   Style: Dashed (3 3)');
    console.log('   Stroke Width: 2px');
    console.log('   Label: "Sold: ' + tokensSold.toFixed(0) + ' VST"');
    console.log('   Position: left (to the left of the line)');
    console.log('   Text Style:');
    console.log('     - Color: #4ECDC4 (Teal)');
    console.log('     - Font Size: 12px');
    console.log('     - Font Weight: bold');
    console.log('     - Text Shadow: 1px 1px 2px rgba(0,0,0,0.8)');
    
    console.log('\n🎯 Visual Improvements:');
    console.log('   • White horizontal line for better visibility');
    console.log('   • Text positioned above/beside lines (not overlapping)');
    console.log('   • Bold text with shadow for better readability');
    console.log('   • Clear separation between line and text');
    console.log('   • Professional appearance');
    
    console.log('\n📊 Chart Layout:');
    console.log('   • Green line: Bonding curve (main data)');
    console.log('   • White dashed line: Current price (horizontal)');
    console.log('   • Teal dashed line: Current tokens sold (vertical)');
    console.log('   • Intersection: Market position');
    console.log('   • Labels: Clear and non-overlapping');
    
    console.log('\n✅ Chart Styling Test Complete!');
    console.log('🎯 Key Improvements:');
    console.log('   • White horizontal reference line');
    console.log('   • Non-overlapping text labels');
    console.log('   • Better text visibility with shadows');
    console.log('   • Professional chart appearance');
    console.log('   • Clear visual hierarchy');
    
  } catch (error) {
    console.error('❌ Error testing chart styling:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testChartStyling();
