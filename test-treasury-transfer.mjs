import { Client, AccountId, PrivateKey, TransferTransaction, Hbar } from '@hashgraph/sdk';

console.log('🔄 Testing HBAR transfer from Treasury to Buyer...');
console.log('='.repeat(50));

const client = Client.forMainnet();
const treasuryId = AccountId.fromString('0.0.9451398');
const buyerId = AccountId.fromString('0.0.9563620');
const treasuryKey = PrivateKey.fromStringECDSA('d8fc50eb2ca055b1703bc9bc225889ffa29565b3e5ad63b6a384f2adba2daebb');

client.setOperator(treasuryId, treasuryKey);

try {
  console.log('📤 Creating HBAR transfer transaction...');
  console.log('   From Treasury:', treasuryId.toString());
  console.log('   To Buyer:', buyerId.toString());
  console.log('   Amount: 1 HBAR');
  
  const transaction = new TransferTransaction()
    .addHbarTransfer(treasuryId, -100000000) // -1 HBAR from treasury
    .addHbarTransfer(buyerId, 100000000)     // +1 HBAR to buyer
    .setTransactionMemo('Test HBAR Transfer - Bonding Curve Sell')
    .setTransactionValidDuration(120)
    .setMaxTransactionFee(new Hbar(5)); // Set max fee to 5 HBAR

  console.log('📡 Executing transaction...');
  const txResponse = await transaction.execute(client);
  const receipt = await txResponse.getReceipt(client);
  
  console.log('✅ Transfer successful!');
  console.log('   Transaction ID:', txResponse.transactionId.toString());
  console.log('   Status:', receipt.status.toString());
  
  // Check balances after transfer
  console.log('\\n🔍 Checking balances after transfer...');
  
  const treasuryBalance = await new AccountBalanceQuery()
    .setAccountId(treasuryId)
    .execute(client);
  
  const buyerBalance = await new AccountBalanceQuery()
    .setAccountId(buyerId)
    .execute(client);
  
  console.log('💰 Treasury Balance:', treasuryBalance.hbars.toString());
  console.log('💰 Buyer Balance:', buyerBalance.hbars.toString());
  
} catch (error) {
  console.error('❌ Transfer failed:', error.message);
  console.error('   Error details:', error);
}
