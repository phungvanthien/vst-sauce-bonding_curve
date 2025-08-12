import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vaultService, VaultState, TraderInfo, Transaction, WithdrawStatus } from '@/services/vaultService';
import { toast } from '@/hooks/use-toast';
import { HEDERA_CONFIG } from '@/config/hederaConfig';

export interface Vault {
  id: number;
  name: string;
  description: string;
  token: string;
  tokenAddress: string;
  vaultAddress: string;
  totalDeposits: number;
  totalShares: number;
  shareholderCount: number;
  maxShareholders: number;
  runTimestamp: number;
  stopTimestamp: number;
  depositsClosed: boolean;
  withdrawalsEnabled: boolean;
  apy: number;
  riskLevel: string;
  status: string;
  isReal?: boolean;
}

/**
 * useVault Hook - Manages vault operations with built-in rate limiting
 * 
 * Rate Limiting Strategy:
 * - 500ms delay between vault state updates
 * - 300ms delay before loading user data
 * - 200ms delay before individual user data operations
 * 
 * This prevents overwhelming the Hedera network and ensures reliable operations.
 */
export const useVault = () => {
  const { user } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [userShares, setUserShares] = useState(0);
  const [userTotalDeposited, setUserTotalDeposited] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [vaultStates, setVaultStates] = useState<Record<string, VaultState>>({});
  const [topTraders, setTopTraders] = useState<TraderInfo[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<WithdrawStatus | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Helper function to add delay between operations to prevent rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Load vault data từ smart contract
  const loadVaultData = useCallback(async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const userAddress = user.walletType === 'hashpack' ? user.accountId : user.walletAddress;
      
      // Khởi tạo contracts nếu chưa có (token1Address will be auto-detected from vault)
      if (vaults.length > 0) {
        await vaultService.initializeContracts(vaults[0].vaultAddress);
      }
      
      // Load vault states từ smart contract with rate limiting
      const newVaultStates: Record<string, VaultState> = {};
      
      for (let i = 0; i < vaults.length; i++) {
        const vault = vaults[i];
        try {
          console.log(`🔍 Loading vault state ${i + 1}/${vaults.length}:`, vault.name);
          
          // Add delay between vault updates to prevent rate limiting
          if (i > 0) {
            console.log('⏳ Waiting 5000ms before next vault update...');
            await delay(5000);
          }
          
          const vaultState = await vaultService.getVaultInfo(vault.vaultAddress);
          newVaultStates[vault.vaultAddress] = vaultState;
          
          // Cập nhật vault data với dữ liệu thực
          setVaults(prev => prev.map(v => 
            v.id === vault.id 
              ? {
                  ...v,
                  totalShares: vaultState.totalShares,
                  shareholderCount: vaultState.shareholderCount,
                  depositsClosed: vaultState.depositsClosed,
                  withdrawalsEnabled: vaultState.withdrawalsEnabled,
                  totalDeposits: vaultState.totalBalance
                }
              : v
          ));
          
          console.log(`✅ Vault ${vault.name} state updated successfully`);
          
        } catch (error) {
          console.error(`Error loading vault ${vault.name}:`, error);
        }
      }
      
      setVaultStates(newVaultStates);
      
      // Add delay before loading user data to ensure vault states are fully loaded
      console.log('⏳ Waiting 300ms before loading user data...');
      await delay(300);
      
      // Load user token balance using token1Address from vault state
      if (vaults.length > 0 && newVaultStates[vaults[0].vaultAddress]) {
        const vaultState = newVaultStates[vaults[0].vaultAddress];
        const token1Address = vaultState.token1Address;
        
        if (token1Address) {
          console.log('💰 Loading user balance with token1 from vault:', {
            vaultAddress: vaults[0].vaultAddress,
            token1Address: token1Address,
            configTokenAddress: vaults[0].tokenAddress
          });
          
          const balanceSmallest = await vaultService.getTokenBalance(
            token1Address,  // Use dynamic token1Address from vault
            userAddress
          );
          // Convert from smallest units to normal units for UI display
          const tokenDecimals = vaults[0].token === 'HBAR' ? 8 : 6; // HBAR=8, USDC=6
          const balanceInUnits = balanceSmallest / Math.pow(10, tokenDecimals);
          
          console.log('💰 User token balance loaded:', {
            balanceSmallest,
            balanceInUnits,
            token: vaults[0].token,
            decimals: tokenDecimals,
            token1Address: token1Address
          });
          
          setUserTokenBalance(balanceInUnits);
        } else {
          console.warn('⚠️ No token1Address found in vault state, using fallback');
          // Fallback to config tokenAddress if token1Address not available
          const balanceSmallest = await vaultService.getTokenBalance(
            vaults[0].tokenAddress, 
            userAddress
          );
          const tokenDecimals = vaults[0].token === 'HBAR' ? 8 : 6;
          const balanceInUnits = balanceSmallest / Math.pow(10, tokenDecimals);
          setUserTokenBalance(balanceInUnits);
        }
      }
      
    } catch (error) {
      console.error('Error loading vault data:', error);
      toast({
        title: "Error",
        description: "Failed to load vault data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [user, vaults]);

  // Load user shares và total deposited cho vault được chọn
  const loadUserData = useCallback(async () => {
    if (!selectedVault || !user) return;

    try {
      console.log('👤 Loading user data for vault:', selectedVault.name);
      
      // Add delay before loading user data to prevent rate limiting
      console.log('⏳ Waiting 200ms before loading user data...');
      await delay(200);
      
      // Initialize contracts nếu là real vault
      if (selectedVault.isReal) {
        console.log('🔧 Initializing contracts for real vault...');
        await vaultService.initializeContracts(selectedVault.vaultAddress, selectedVault.tokenAddress);
      }
      
      const userAddress = user.walletType === 'hashpack' ? user.accountId : user.walletAddress;
      console.log('👤 User address:', userAddress);
      
      const [shares, totalDeposited] = await Promise.all([
        vaultService.getUserShares(selectedVault.vaultAddress, userAddress),
        vaultService.getUserTotalDeposited(selectedVault.vaultAddress, userAddress)
      ]);
      
      setUserShares(shares);
      setUserTotalDeposited(totalDeposited);
      
      console.log('✅ User data loaded:', { shares, totalDeposited });
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setUserShares(0);
      setUserTotalDeposited(0);
    }
  }, [selectedVault, user]);

  // Load top traders
  const loadTopTraders = useCallback(async () => {
    if (!selectedVault) return;

    try {
      const traders = await vaultService.getTopTraders(selectedVault.vaultAddress);
      setTopTraders(traders);
    } catch (error) {
      console.error('Error loading top traders:', error);
      setTopTraders([]);
    }
  }, [selectedVault]);

  // Load transaction history
  const loadTransactionHistory = useCallback(async () => {
    if (!selectedVault) return;

    try {
      const transactions = await vaultService.getTransactionHistory(selectedVault.vaultAddress);
      setTransactionHistory(transactions);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactionHistory([]);
    }
  }, [selectedVault]);

  // Approve token với max value (standalone function - deposit now includes this)
  const approveToken = useCallback(async (amount: number) => {
    if (!selectedVault || !user) {
      throw new Error('No vault selected or user not connected');
    }

    // Check if vault uses HBAR (no approval needed) 
    if (selectedVault.token === 'HBAR') {
      console.log('ℹ️ HBAR vault - no approval needed');
      toast({
        title: "No Approval Needed", 
        description: "HBAR deposits don't require token approval",
      });
      return true;
    }

    console.log('🔐 Starting token approval...', {
      vault: selectedVault.name,
      amount
    });

    setIsLoading(true);
    try {
      // Initialize contracts nếu là real vault (token1Address will be auto-detected)
      if (selectedVault.isReal) {
        console.log('🔧 Initializing contracts for approval...');
        await vaultService.initializeContracts(selectedVault.vaultAddress);
      }

      const userAddress = user.walletType === 'hashpack' ? user.accountId : user.walletAddress;
      console.log('👤 User address for approval:', userAddress);
      
      // Get token1Address from vault state
      const vaultState = vaultStates[selectedVault.vaultAddress];
      const token1Address = vaultState?.token1Address || selectedVault.tokenAddress; // Fallback to config
      
      console.log('🔐 Approving tokens with dynamic token1Address...', {
        token1Address: token1Address,
        configTokenAddress: selectedVault.tokenAddress,
        vaultAddress: selectedVault.vaultAddress
      });
      
      // Approve token spending với max value
      toast({
        title: "Approving tokens",
        description: "Please approve token spending in your wallet (max value)",
      });
      
      const approveTx = await vaultService.approveToken(
        token1Address,  // Use dynamic token1Address from vault state
        selectedVault.vaultAddress,
        amount
      );
      
      console.log('✅ Approve transaction sent:', approveTx.transactionId);
      try {
        console.log('🔎 Approve txId string:', approveTx.transactionId.toString());
      } catch {}
      
      // Đợi approve transaction hoàn thành
      toast({
        title: "Waiting for approval",
        description: "Please wait for approval transaction to complete...",
      });
      
      const receipt = await vaultService.waitForReceipt(approveTx);
      console.log('✅ Approve receipt:', receipt);
      
      toast({
        title: "Approval successful",
        description: "Tokens approved for vault deposit",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Approval error:', error);
      
      // If it's a connection error, try to force reconnect
      if (error.message.includes('HashConnect not connected')) {
        console.log('🔄 Attempting force reconnect...');
        try {
          await vaultService.forceReconnect();
          toast({
            title: "Reconnected",
            description: "HashConnect reconnected successfully. Please try again.",
          });
        } catch (reconnectError) {
          console.error('❌ Force reconnect failed:', reconnectError);
          toast({
            title: "Connection Error",
            description: "Please connect your HashPack wallet first.",
            variant: "destructive"
          });
        }
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedVault, user]);

  // Deposit vào vault
  const deposit = useCallback(async (amount: number) => {
    if (!selectedVault || !user) {
      throw new Error('No vault selected or user not connected');
    }

    if (selectedVault.depositsClosed) {
      throw new Error('Deposits are closed for this vault');
    }

    if (selectedVault.shareholderCount >= selectedVault.maxShareholders) {
      throw new Error('Vault has reached maximum shareholders');
    }

    console.log('🔍 Balance check:', {
      requestedAmount: amount,
      userTokenBalance,
      token: selectedVault.token,
      isSufficient: amount <= userTokenBalance
    });

    if (amount > userTokenBalance) {
      throw new Error(`Insufficient ${selectedVault.token} balance. You have ${userTokenBalance} ${selectedVault.token} but need ${amount} ${selectedVault.token}`);
    }

    console.log('💰 Starting deposit process...', {
      vault: selectedVault.name,
      amount,
      isRealVault: selectedVault.id === 4
    });

    setIsLoading(true);
    try {
      // Initialize contracts nếu là real vault (token1Address will be auto-detected)
      if (selectedVault.isReal) {
        console.log('🔧 Initializing contracts for real vault deposit...');
        await vaultService.initializeContracts(selectedVault.vaultAddress);
      }

      // Execute deposit via HashConnect (includes approve + deposit)
      console.log('🔗 Starting HashConnect deposit process...');
      toast({
        title: "Processing deposit",
        description: "Please confirm transactions in HashPack wallet",
      });

      const depositResult = await vaultService.deposit(selectedVault.vaultAddress, amount);
      console.log('✅ HashConnect deposit completed:', depositResult);

      // HashConnect deposit result handling
      if (depositResult) {
        console.log('✅ HashConnect deposit completed successfully');
        
        // Extract transaction ID if available for logging
        const transactionId = depositResult?.transactionId || depositResult?.transaction_id;
        if (transactionId) {
          console.log('🔎 Deposit transaction ID:', transactionId);
        }
      } else {
        console.log('ℹ️ Transaction submitted via HashConnect, assuming success');
      }
      
      toast({
        title: "Success",
        description: `Successfully deposited ${amount} ${selectedVault.token}`,
      });
      
      // Refresh data
      await Promise.all([
        loadVaultData(),
        loadUserData(),
        loadTopTraders(),
        loadTransactionHistory()
      ]);
      
    } catch (error) {
      console.error('❌ Deposit error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedVault, user, userTokenBalance, approveToken, loadVaultData, loadUserData, loadTopTraders, loadTransactionHistory]);

  // Withdraw từ vault
  const withdraw = useCallback(async (amount: number) => {
    if (!selectedVault || !user) {
      throw new Error('No vault selected or user not connected');
    }

    if (!selectedVault.withdrawalsEnabled) {
      throw new Error('Withdrawals are not yet enabled for this vault');
    }

    if (amount > userShares) {
      throw new Error('Insufficient shares for withdrawal');
    }

    setIsLoading(true);
    try {
      // Withdraw từ vault
      toast({
        title: "Withdrawing",
        description: "Please confirm withdrawal transaction in your wallet",
      });
      
      const withdrawTx = await vaultService.withdraw(selectedVault.vaultAddress);
      await vaultService.waitForReceipt(withdrawTx);
      
      toast({
        title: "Success",
        description: `Successfully withdrawn ${amount} shares`,
      });
      
      // Refresh data
      await Promise.all([
        loadVaultData(),
        loadUserData(),
        loadTopTraders(),
        loadTransactionHistory()
      ]);
      
    } catch (error) {
      console.error('Withdraw error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedVault, user, userShares, loadVaultData, loadUserData, loadTopTraders, loadTransactionHistory]);

  // Kiểm tra trạng thái withdraw
  const checkWithdrawStatus = useCallback(async () => {
    if (!selectedVault) return;

    try {
      const status = await vaultService.checkWithdrawStatus(selectedVault.vaultAddress);
      setWithdrawStatus(status);
    } catch (error) {
      console.error('Error checking withdraw status:', error);
      setWithdrawStatus({
        canWithdraw: false,
        isProcessing: false,
        message: 'Error checking withdraw status',
      });
    }
  }, [selectedVault]);

  // Gửi withdraw request
  const requestWithdraw = useCallback(async () => {
    if (!selectedVault || !user) {
      toast({
        title: "Error",
        description: "Please select a vault and connect wallet",
        variant: "destructive"
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      // Kiểm tra trạng thái withdraw trước
      const status = await vaultService.checkWithdrawStatus(selectedVault.vaultAddress);
      
      if (!status.canWithdraw) {
        toast({
          title: "Cannot Withdraw",
          description: status.message,
          variant: "destructive"
        });
        return;
      }

      // Thực hiện withdraw request
      const tx = await vaultService.requestWithdraw(selectedVault.vaultAddress);
      
      toast({
        title: "Withdraw Request Sent",
        description: "Your withdraw request is being processed...",
      });

      // Chờ transaction được confirm
      const receipt = await vaultService.waitForReceipt(tx);
      
      toast({
        title: "Withdraw Successful",
        description: `Transaction confirmed: ${vaultService.formatHash(receipt.transactionHash)}`,
      });

      // Refresh data sau khi withdraw thành công
      await Promise.all([
        loadVaultData(),
        loadUserData(),
        loadTopTraders(),
        loadTransactionHistory()
      ]);

    } catch (error) {
      console.error('Error requesting withdraw:', error);
      toast({
        title: "Withdraw Failed",
        description: error instanceof Error ? error.message : "Failed to process withdraw request",
        variant: "destructive"
      });
    } finally {
      setIsWithdrawing(false);
    }
  }, [selectedVault, user, loadVaultData, loadUserData, loadTopTraders, loadTransactionHistory]);

  // Initialize vaults với mock data + smart contract thực
  useEffect(() => {
    const initializeVaults = async () => {
      // Debug environment variables
      console.log('🔧 Environment variables:', {
        VITE_VAULT_ADDRESS: import.meta.env.VITE_VAULT_ADDRESS,
        VITE_TOKEN_ADDRESS: import.meta.env.VITE_TOKEN_ADDRESS,
        VAULT_ADDRESS: import.meta.env.VAULT_ADDRESS,
        TOKEN_ADDRESS: import.meta.env.TOKEN_ADDRESS,
        HEDERA_CONFIG: HEDERA_CONFIG.contracts
      });

      // Initialize mock vaults (remove old vault #1; keep 2 and 3)
      const mockVaults: Vault[] = [
        {
          id: 2,
          name: "Conservative Income Vault",
          description: "Stable income generation with lower risk",
          token: "HBAR",
          tokenAddress: "0x5081a39b8A5f0E35a8D959395a630b68B74Dd30f",
          vaultAddress: "0x2fA02b2d6A771842690194Cf62D91bdd92BfE28e",
          totalDeposits: 1800000,
          totalShares: 1800000,
          shareholderCount: 32,
          maxShareholders: 50,
          runTimestamp: 1754568292,
          stopTimestamp: 1754568592,
          depositsClosed: false,
          withdrawalsEnabled: false,
          apy: 8.2,
          riskLevel: "Low",
          status: "active",
          isReal: false,
        },
        {
          id: 3,
          name: "Aggressive Trading Vault",
          description: "High-risk, high-reward trading strategies",
          token: "HBAR",
          tokenAddress: "0x5081a39b8A5f0E35a8D959395a630b68B74Dd30f",
          vaultAddress: "0x3fA02b2d6A771842690194Cf62D91bdd92BfE28f",
          totalDeposits: 3200000,
          totalShares: 3200000,
          shareholderCount: 48,
          maxShareholders: 50, // Updated from 100 to 50
          runTimestamp: 1754368292,
          stopTimestamp: 1754368592,
          depositsClosed: true,
          withdrawalsEnabled: false,
          apy: 18.7,
          riskLevel: "High",
          status: "deposits_closed",
          isReal: false,
        }
      ];

      // Thêm real vault nếu được bật
      if (HEDERA_CONFIG.development.enableRealContract) {
        const realVault: Vault = {
          id: 1,
          name: HEDERA_CONFIG.vaultInfo.name,
          description: HEDERA_CONFIG.vaultInfo.description,
          token: HEDERA_CONFIG.vaultInfo.token,
          tokenAddress: HEDERA_CONFIG.contracts.tokenContractId,
          vaultAddress: HEDERA_CONFIG.contracts.vaultContractId,
          totalDeposits: 0,
          totalShares: 0,
          shareholderCount: 0,
          maxShareholders: HEDERA_CONFIG.vaultInfo.maxShareholders,
          runTimestamp: 0,
          stopTimestamp: 0,
          depositsClosed: false,
          withdrawalsEnabled: false,
          apy: HEDERA_CONFIG.vaultInfo.apy,
          riskLevel: HEDERA_CONFIG.vaultInfo.riskLevel,
          status: "active",
          isReal: true,
        };

        // Place real vault at position 1
        mockVaults.unshift(realVault);
        
        if (HEDERA_CONFIG.development.enableLogging) {
          console.log('✅ Real vault added:', realVault);
        }
      }

      setVaults(mockVaults);
    };

    initializeVaults();
  }, []);

  // Load data khi user thay đổi
  useEffect(() => {
    if (user && vaults.length > 0) {
      loadVaultData();
    }
  }, [user, vaults.length, loadVaultData]);

  // Load user data, traders và transaction history khi chọn vault
  useEffect(() => {
    if (selectedVault && user) {
      Promise.all([
        loadUserData(),
        loadTopTraders(),
        loadTransactionHistory()
      ]);
    }
  }, [selectedVault, user, loadUserData, loadTopTraders, loadTransactionHistory]);

  // Effect để kiểm tra withdraw status khi selected vault thay đổi
  useEffect(() => {
    if (selectedVault) {
      checkWithdrawStatus();
    }
  }, [selectedVault, checkWithdrawStatus]);

  return {
    vaults, selectedVault, setSelectedVault, userShares, userTotalDeposited, userTokenBalance,
    vaultStates, topTraders, transactionHistory, isLoading, isRefreshing, withdrawStatus, isWithdrawing,
    loadVaultData, loadUserData, loadTopTraders, loadTransactionHistory, deposit, approveToken, withdraw, requestWithdraw, checkWithdrawStatus
  };
};

export { vaultService }; 