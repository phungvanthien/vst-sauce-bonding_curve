import { ethers } from 'ethers';
import { VAULTS_CONFIG } from '@/config/hederaConfig';
import vaultABI from '../../VaultABI.json';

// Test configuration
const TEST_CONFIG = {
  // Real vault EVM address
  vaultEvmAddress: '0xEA316d96F85e662aa7e213A900A87dbDDfCbE99a',
  // Expected values for testing (these will be updated based on actual contract values)
  expectedValues: {
    runTimestamp: 0, // Will be updated based on actual contract
    stopTimestamp: 0, // Will be updated based on actual contract
    token1Address: '', // Will be updated based on actual contract
    token2Address: '', // Will be updated based on actual contract
  }
};

// Use the real vault ABI from Vault.json
const VAULT_ABI = vaultABI.abi;

/**
 * Test class for vault state functions
 */
export class VaultStateTest {
  private provider: ethers.providers.JsonRpcProvider;
  private vaultContract: ethers.Contract | null = null;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider('https://mainnet.hashio.io/api');
    console.log('🔧 VaultStateTest initialized with RPC: https://mainnet.hashio.io/api');
    console.log('📋 Using real Vault ABI with', VAULT_ABI.length, 'functions');
  }



  /**
   * Initialize vault contract for testing
   */
  async initializeVaultContract(vaultEvmAddress?: string): Promise<void> {
    try {
      const address = vaultEvmAddress || TEST_CONFIG.vaultEvmAddress;
      console.log('🔧 Initializing vault contract with EVM address:', address);
      
      this.vaultContract = new ethers.Contract(address, VAULT_ABI, this.provider);
      console.log(address, VAULT_ABI, this.provider);
      console.log('✅ Vault contract initialized with real ABI');
    } catch (error) {
      console.error('❌ Error initializing vault contract:', error);
      throw error;
    }
  }

  /**
   * Test runTimestamp function
   */
  async testRunTimestamp(): Promise<{ success: boolean; value: number; error?: string }> {
    try {
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      console.log('🧪 Testing runTimestamp...');
      const timestamp = await this.vaultContract.runTimestamp();
      const value = timestamp.toNumber ? timestamp.toNumber() : Number(timestamp);
      
      console.log('✅ runTimestamp test passed:', { value, expected: TEST_CONFIG.expectedValues.runTimestamp });
      
      return { success: true, value };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ runTimestamp test failed:', errorMsg);
      return { success: false, value: 0, error: errorMsg };
    }
  }

  /**
   * Test stopTimestamp function
   */
  async testStopTimestamp(): Promise<{ success: boolean; value: number; error?: string }> {
    try {
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      console.log('🧪 Testing stopTimestamp...');
      const timestamp = await this.vaultContract.stopTimestamp();
      const value = timestamp.toNumber ? timestamp.toNumber() : Number(timestamp);
      
      console.log('✅ stopTimestamp test passed:', { value, expected: TEST_CONFIG.expectedValues.stopTimestamp });
      
      return { success: true, value };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ stopTimestamp test failed:', errorMsg);
      return { success: false, value: 0, error: errorMsg };
    }
  }

  /**
   * Test token1 function
   */
  async testToken1Address(): Promise<{ success: boolean; value: string; error?: string }> {
    try {
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      console.log('🧪 Testing token1...');
      const address = await this.vaultContract.token1();
      const value = typeof address === 'string' ? address : address.toString();
      
      console.log('✅ token1 test passed:', { value, expected: TEST_CONFIG.expectedValues.token1Address });
      
      return { success: true, value };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ token1 test failed:', errorMsg);
      return { success: false, value: '', error: errorMsg };
    }
  }

  /**
   * Test token2 function
   */
  async testToken2Address(): Promise<{ success: boolean; value: string; error?: string }> {
    try {
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      console.log('🧪 Testing token2...');
      const address = await this.vaultContract.token2();
      const value = typeof address === 'string' ? address : address.toString();
      
      console.log('✅ token2 test passed:', { value, expected: TEST_CONFIG.expectedValues.token2Address });
      
      return { success: true, value };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ token2 test failed:', errorMsg);
      return { success: false, value: '', error: errorMsg };
    }
  }

  /**
   * Test additional vault state functions
   */
  async testAdditionalState(): Promise<{ success: boolean; data: any; error?: string }> {
    try {
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      console.log('🧪 Testing additional vault state...');
      
      const [totalShares, maxShareholders, manager, depositsClosed, vaultClosed] = await Promise.all([
        this.vaultContract.totalShares(),
        this.vaultContract.maxShareholders(),
        this.vaultContract.manager(),
        this.vaultContract.depositsClosed(),
        this.vaultContract.vaultClosed()
      ]);

      const data = {
        totalShares: totalShares.toNumber ? totalShares.toNumber() : Number(totalShares),
        maxShareholders: maxShareholders.toNumber ? maxShareholders.toNumber() : Number(maxShareholders),
        manager: typeof manager === 'string' ? manager : manager.toString(),
        depositsClosed: Boolean(depositsClosed),
        vaultClosed: Boolean(vaultClosed)
      };

      console.log('✅ Additional state test passed:', data);
      
      return { success: true, data };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Additional state test failed:', errorMsg);
      return { success: false, data: {}, error: errorMsg };
    }
  }

  /**
   * Test getVaultState function (returns multiple values)
   */
  async testGetVaultState(): Promise<{ success: boolean; data: any; error?: string }> {
    try {
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      console.log('🧪 Testing getVaultState...');
      
      const vaultState = await this.vaultContract.getVaultState();
      
      // Convert totalBalance from microUSDC (6 decimals) to USDC
      const totalBalanceRaw = vaultState[1].toNumber ? vaultState[1].toNumber() : Number(vaultState[1]);
      const totalBalanceConverted = totalBalanceRaw / Math.pow(10, 6); // Convert from microUSDC to USDC
      
      const data = {
        totalShares: vaultState[0].toNumber ? vaultState[0].toNumber() : Number(vaultState[0]),
        totalBalance: totalBalanceConverted, // Use converted USDC value
        shareholderCount: vaultState[2].toNumber ? vaultState[2].toNumber() : Number(vaultState[2]),
        depositsClosed: Boolean(vaultState[3]),
        vaultClosed: Boolean(vaultState[4])
      };

      console.log('✅ getVaultState test passed:', data);
      
      return { success: true, data };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ getVaultState test failed:', errorMsg);
      return { success: false, data: {}, error: errorMsg };
    }
  }

  /**
   * Test network connectivity
   */
  async testNetworkConnectivity(): Promise<{ success: boolean; networkInfo: any; error?: string }> {
    try {
      console.log('🧪 Testing network connectivity...');
      
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getGasPrice();
      
      const networkInfo = {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        gasPrice: gasPrice.toString()
      };
      
      console.log('✅ Network connectivity test passed:', networkInfo);
      
      return { success: true, networkInfo };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Network connectivity test failed:', errorMsg);
      return { success: false, networkInfo: {}, error: errorMsg };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(vaultEvmAddress?: string): Promise<{
    summary: { total: number; passed: number; failed: number };
    results: { [key: string]: any };
  }> {
    const address = vaultEvmAddress || TEST_CONFIG.vaultEvmAddress;
    console.log('🚀 Starting vault state tests...');
          console.log('📋 Test configuration:', { vaultEvmAddress: address, rpcUrl: 'https://mainnet.hashio.io/api' });
    
    const results: { [key: string]: any } = {};
    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Network connectivity
      const networkTest = await this.testNetworkConnectivity();
      results.networkConnectivity = networkTest;
      networkTest.success ? passed++ : failed++;

      // Test 2: Initialize vault contract
      await this.initializeVaultContract(address);
      results.contractInitialization = { success: true };

      // Test 3: Basic state functions
      const runTimestampTest = await this.testRunTimestamp();
      results.runTimestamp = runTimestampTest;
      runTimestampTest.success ? passed++ : failed++;

      const stopTimestampTest = await this.testStopTimestamp();
      results.stopTimestamp = stopTimestampTest;
      stopTimestampTest.success ? passed++ : failed++;

      const token1Test = await this.testToken1Address();
      results.token1Address = token1Test;
      token1Test.success ? passed++ : failed++;

      const token2Test = await this.testToken2Address();
      results.token2Address = token2Test;
      token2Test.success ? passed++ : failed++;

      // Test 4: Additional state functions
      const additionalStateTest = await this.testAdditionalState();
      results.additionalState = additionalStateTest;
      additionalStateTest.success ? passed++ : failed++;

      // Test 5: getVaultState function
      const getVaultStateTest = await this.testGetVaultState();
      results.getVaultState = getVaultStateTest;
      getVaultStateTest.success ? passed++ : failed++;

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      results.executionError = { success: false, error: String(error) };
      failed++;
    }

    const summary = { total: passed + failed, passed, failed };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
    
    return { summary, results };
  }

  /**
   * Test with custom vault EVM address
   */
  async testCustomVault(customEvmAddress: string): Promise<void> {
    console.log(`🔧 Testing custom vault: ${customEvmAddress}`);
    const results = await this.runAllTests(customEvmAddress);
    
    console.log('\n🎯 Custom Vault Test Results:');
    console.log('=============================');
    console.log(JSON.stringify(results, null, 2));
  }
}

/**
 * Main test execution function
 */
export async function runVaultStateTests(): Promise<void> {
  try {
    const tester = new VaultStateTest();
    
    console.log('🧪 Vault State Test Suite');
    console.log('=========================');
          console.log('Network: Hedera Mainnet');
      console.log('RPC URL: https://mainnet.hashio.io/api');
      console.log('Chain ID: 295');
    console.log('ABI Source: Real Vault.json file');
    
    const results = await tester.runAllTests();
    
    if (results.summary.failed === 0) {
      console.log('\n🎉 All tests passed! Vault state reading is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the results above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
  }
}

/**
 * Test specific vault contract
 */
export async function testSpecificVault(evmAddress: string): Promise<void> {
  try {
    const tester = new VaultStateTest();
    await tester.testCustomVault(evmAddress);
  } catch (error) {
    console.error('❌ Specific vault test failed:', error);
  }
}

// Export for use in other files
export default {
  VaultStateTest,
  runVaultStateTests,
  testSpecificVault
}; 