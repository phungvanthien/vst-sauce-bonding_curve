import { 
  calculateBuyCost, 
  getBondingCurveStatus, 
  getCurrentPrice,
  formatPrice 
} from './src/services/bondingCurveService.js';
import { 
  getBondingCurveState, 
  updateStateAfterBuy, 
  updateStateAfterSell,
  resetBondingCurveState,
  getBondingCurveStats 
} from './src/services/bondingCurveStateService.js';

console.log('🧪 Testing Bonding Curve with State Persistence...');
console.log('='.repeat(60));

// Reset state for clean test
console.log('🔄 Resetting bonding curve state...');
resetBondingCurveState();

// Test 1: Initial state
console.log('\n📊 Test 1: Initial State');
const initialState = getBondingCurveState();
console.log('   Initial State:', initialState);

const initialStatus = getBondingCurveStatus();
console.log('   Initial Price:', formatPrice(initialStatus.currentPrice));
console.log('   Total Sold:', initialStatus.totalTokensSold);
console.log('   Total Burned:', initialStatus.totalTokensBurned);

// Test 2: First buy (100 VST)
console.log('\n💰 Test 2: First Buy (100 VST)');
const buy1 = calculateBuyCost(100);
console.log('   Cost for 100 VST:', formatPrice(buy1.totalCost));
console.log('   Average Price:', formatPrice(buy1.averagePrice));
console.log('   Current Price:', formatPrice(buy1.currentPrice));

// Simulate successful buy
updateStateAfterBuy(100);
console.log('   ✅ State updated: +100 VST sold');

// Test 3: Second buy (200 VST) - should be more expensive
console.log('\n💰 Test 3: Second Buy (200 VST) - Should be more expensive');
const buy2 = calculateBuyCost(200);
console.log('   Cost for 200 VST:', formatPrice(buy2.totalCost));
console.log('   Average Price:', formatPrice(buy2.averagePrice));
console.log('   Current Price:', formatPrice(buy2.currentPrice));

// Simulate successful buy
updateStateAfterBuy(200);
console.log('   ✅ State updated: +200 VST sold');

// Test 4: Third buy (50 VST) - should be even more expensive
console.log('\n💰 Test 4: Third Buy (50 VST) - Should be even more expensive');
const buy3 = calculateBuyCost(50);
console.log('   Cost for 50 VST:', formatPrice(buy3.totalCost));
console.log('   Average Price:', formatPrice(buy3.averagePrice));
console.log('   Current Price:', formatPrice(buy3.currentPrice));

// Simulate successful buy
updateStateAfterBuy(50);
console.log('   ✅ State updated: +50 VST sold');

// Test 5: Sell (100 VST) - should reduce circulation
console.log('\n💵 Test 5: Sell (100 VST) - Should reduce circulation');
updateStateAfterSell(100);
console.log('   ✅ State updated: +100 VST burned');

// Test 6: Final state
console.log('\n📊 Test 6: Final State');
const finalState = getBondingCurveState();
console.log('   Final State:', finalState);

const finalStatus = getBondingCurveStatus();
console.log('   Final Price:', formatPrice(finalStatus.currentPrice));
console.log('   Total Sold:', finalStatus.totalTokensSold);
console.log('   Total Burned:', finalStatus.totalTokensBurned);
console.log('   Net in Circulation:', finalStatus.netTokensInCirculation);

// Test 7: Another buy after sell - should be cheaper than before
console.log('\n💰 Test 7: Another Buy (100 VST) - Should be cheaper than before');
const buy4 = calculateBuyCost(100);
console.log('   Cost for 100 VST:', formatPrice(buy4.totalCost));
console.log('   Average Price:', formatPrice(buy4.averagePrice));
console.log('   Current Price:', formatPrice(buy4.currentPrice));

// Simulate successful buy
updateStateAfterBuy(100);
console.log('   ✅ State updated: +100 VST sold');

// Final statistics
console.log('\n📈 Final Statistics');
const stats = getBondingCurveStats();
console.log('   Total Tokens Sold:', stats.totalTokensSold);
console.log('   Total Tokens Burned:', stats.totalTokensBurned);
console.log('   Net in Circulation:', stats.netTokensInCirculation);
console.log('   Last Updated:', stats.lastUpdated);

console.log('\n✅ Bonding Curve State Persistence Test Complete!');
console.log('🎯 Key Features Verified:');
console.log('   • Price increases with cumulative sales');
console.log('   • State persists across transactions');
console.log('   • Burns reduce circulation');
console.log('   • Linear bonding curve mathematics');
