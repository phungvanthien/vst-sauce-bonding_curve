// Test setup cho Vault contract
export const TEST_VAULT_CONFIG = {
  // Test timestamps - có thể điều chỉnh để test các trường hợp khác nhau
  RUN_TIMESTAMP: Math.floor(Date.now() / 1000) - 3600, // 1 giờ trước
  STOP_TIMESTAMP: Math.floor(Date.now() / 1000) + 3600, // 1 giờ sau (để test "wait for stop time")
  
  // Test với stop time đã qua (để test "can withdraw")
  STOP_TIMESTAMP_PASSED: Math.floor(Date.now() / 1000) - 1800, // 30 phút trước
  
  // Token test
  TOKEN_ADDRESS: "0x1234567890123456789012345678901234567890", // Mock token address
  VAULT_ADDRESS: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", // Mock vault address
  
  // Test amounts
  DEPOSIT_AMOUNT: 1000, // 1000 tokens
  WITHDRAW_AMOUNT: 500,  // 500 tokens
};

// Mock vault data cho testing
export const MOCK_VAULTS = [
  {
    id: 1,
    name: "Test Vault - Wait for Stop Time",
    description: "Vault để test trường hợp chưa đến stop time",
    token: "TEST",
    tokenAddress: TEST_VAULT_CONFIG.TOKEN_ADDRESS,
    vaultAddress: TEST_VAULT_CONFIG.VAULT_ADDRESS,
    totalDeposits: 50000,
    totalShares: 1000,
    shareholderCount: 5,
    maxShareholders: 10,
    runTimestamp: TEST_VAULT_CONFIG.RUN_TIMESTAMP,
    stopTimestamp: TEST_VAULT_CONFIG.STOP_TIMESTAMP, // Chưa đến stop time
    depositsClosed: false,
    withdrawalsEnabled: false,
    apy: 12.5,
    riskLevel: "Medium",
    status: "Active"
  },
  {
    id: 2,
    name: "Test Vault - Can Withdraw",
    description: "Vault để test trường hợp đã qua stop time",
    token: "TEST",
    tokenAddress: TEST_VAULT_CONFIG.TOKEN_ADDRESS,
    vaultAddress: TEST_VAULT_CONFIG.VAULT_ADDRESS + "1",
    totalDeposits: 75000,
    totalShares: 1500,
    shareholderCount: 8,
    maxShareholders: 10,
    runTimestamp: TEST_VAULT_CONFIG.RUN_TIMESTAMP,
    stopTimestamp: TEST_VAULT_CONFIG.STOP_TIMESTAMP_PASSED, // Đã qua stop time
    depositsClosed: true,
    withdrawalsEnabled: true,
    apy: 15.2,
    riskLevel: "High",
    status: "Withdrawal Phase"
  }
];

// Helper functions cho testing
export const testHelpers = {
  // Tạo timestamp cho testing
  createTestTimestamp: (hoursFromNow: number) => {
    return Math.floor(Date.now() / 1000) + (hoursFromNow * 3600);
  },
  
  // Kiểm tra xem có thể withdraw không
  canWithdraw: (stopTimestamp: number) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= stopTimestamp;
  },
  
  // Format thời gian còn lại
  formatTimeRemaining: (stopTimestamp: number) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const remaining = stopTimestamp - currentTime;
    
    if (remaining <= 0) return "Ready to withdraw";
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }
}; 