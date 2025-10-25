import { getTreasuryBalance, getTreasuryStats, refreshTreasuryBalance } from './src/services/treasuryBalanceService.js';

console.log('🧪 Testing Treasury Balance Service...');
console.log('='.repeat(60));

async function testTreasuryBalance() {
  try {
    console.log('📡 Testing Treasury balance query...');
    
    const balance = await getTreasuryBalance();
    console.log('✅ Treasury Balance Retrieved:');
    console.log('   Account ID:', balance.accountId);
    console.log('   Token ID:', balance.tokenId);
    console.log('   Raw Balance:', balance.balance);
    console.log('   Display Balance:', balance.balanceDisplay.toFixed(2), 'VST');
    console.log('   Tokens Sold:', balance.tokensSold.toFixed(2), 'VST');
    console.log('   Last Updated:', new Date(balance.lastUpdated).toLocaleString());
    
    console.log('\n📊 Testing Treasury stats...');
    const stats = await getTreasuryStats();
    console.log('✅ Treasury Stats:');
    console.log('   Treasury Balance:', stats.treasuryBalance.toFixed(2), 'VST');
    console.log('   Tokens Sold:', stats.tokensSold.toFixed(2), 'VST');
    console.log('   Tokens Remaining:', stats.tokensRemaining.toFixed(2), 'VST');
    console.log('   Sell Percentage:', stats.sellPercentage.toFixed(2), '%');
    console.log('   Last Updated:', stats.lastUpdated);
    
    console.log('\n🔄 Testing cache refresh...');
    const refreshedBalance = await refreshTreasuryBalance();
    console.log('✅ Cache refreshed:');
    console.log('   New Balance:', refreshedBalance.balanceDisplay.toFixed(2), 'VST');
    console.log('   New Tokens Sold:', refreshedBalance.tokensSold.toFixed(2), 'VST');
    
    console.log('\n🎯 Bonding Curve Calculation:');
    const initialSupply = 100000;
    const tokensSold = refreshedBalance.tokensSold;
    const tokensRemaining = initialSupply - tokensSold;
    const sellPercentage = (tokensSold / initialSupply) * 100;
    
    console.log('   Initial Supply:', initialSupply.toFixed(2), 'VST');
    console.log('   Tokens Sold:', tokensSold.toFixed(2), 'VST');
    console.log('   Tokens Remaining:', tokensRemaining.toFixed(2), 'VST');
    console.log('   Sell Progress:', sellPercentage.toFixed(2), '%');
    
    // Calculate bonding curve price
    const initialPrice = 0.1; // 0.1 Sauce per VST
    const kLinear = 0.0001; // Linear coefficient
    const currentPrice = initialPrice * (1 + kLinear * tokensSold);
    
    console.log('\n💰 Bonding Curve Pricing:');
    console.log('   Initial Price:', initialPrice.toFixed(8), 'Sauce per VST');
    console.log('   Current Price:', currentPrice.toFixed(8), 'Sauce per VST');
    console.log('   Price Increase:', ((currentPrice - initialPrice) / initialPrice * 100).toFixed(2), '%');
    
    console.log('\n✅ Treasury Balance Service Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing Treasury balance:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testTreasuryBalance();
