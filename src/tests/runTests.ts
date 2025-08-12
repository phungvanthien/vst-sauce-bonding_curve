import { runVaultStateTests, testSpecificVault } from './vaultStateTest';

/**
 * Simple test runner for vault state tests
 * 
 * Usage:
 * 1. Run all tests: npm run test:vault
 * 2. Test specific vault: npm run test:vault -- --contract 0xEA316d96F85e662aa7e213A900A87dbDDfCbE99a
 */

async function main() {
  // Check if a specific vault EVM address was provided
  const args = process.argv.slice(2);
  const contractIndex = args.indexOf('--contract');
  
  if (contractIndex !== -1 && args[contractIndex + 1]) {
    const evmAddress = args[contractIndex + 1];
    console.log(`🎯 Testing specific vault: ${evmAddress}`);
    await testSpecificVault(evmAddress);
  } else {
    console.log('🧪 Running all vault state tests...');
    await runVaultStateTests();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runTests }; 