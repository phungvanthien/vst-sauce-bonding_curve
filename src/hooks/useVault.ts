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
  const [isLoadingVaultData, setIsLoadingVaultData] = useState(false);
  
  // Helper function to add delay between operations to prevent rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Load vault data từ smart contract
  const loadVaultData = useCallback(async () => {
    if (!user || isLoadingVaultData) return;

    setIsLoadingVaultData(true);
    try {
      const userAddress = user.walletType === 'hashpack' ? user.accountId : user.walletAddress;
      
      // Chỉ load real vault data
      const realVault = vaults.find(v => v.isReal);
      if (!realVault) {
        console.log('ℹ️ No real vault found, skipping real-time updates');
        return;
      }

      console.log('�� Loading real vault data:', realVault.name);
      
      // Initialize contracts for real vault
      await vaultService.initializeContracts(realVault.vaultAddress);
      
      // Get real vault state
      const vaultState = await vaultService.getVaultInfo(realVault.vaultAddress);
      
      // ✅ Lấy timestamps từ smart contract
      const timestamps = await vaultService.getVaultTimestamps();

      // Update vault states
      setVaultStates(prev => ({
        ...prev,
        [realVault.vaultAddress]: vaultState
      }));
      
      // Update real vault data với timestamps chính xác
      setVaults(prev => prev.map(v => 
        v.id === realVault.id 
          ? {
              ...v,
              totalShares: vaultState.totalShares,
              shareholderCount: vaultState.shareholderCount,
              depositsClosed: vaultState.depositsClosed,
              withdrawalsEnabled: vaultState.withdrawalsEnabled,
              totalDeposits: vaultState.totalBalance,
              // ✅ Sử dụng timestamps từ smart contract
              runTimestamp: timestamps.runTimestamp,
              stopTimestamp: timestamps.stopTimestamp
            }
          : v
      ));
      
      console.log('✅ Real vault updated successfully');
      
      // Load user token balance only for real vault
      if (vaultState.token1Address) {
        const balanceSmallest = await vaultService.getTokenBalanceContract(
          vaultState.token1Address,
          userAddress
        );
        const tokenDecimals = realVault.token === 'HBAR' ? 8 : 6;
        const balanceInUnits = balanceSmallest / Math.pow(10, tokenDecimals);
        setUserTokenBalance(balanceInUnits);
      }
      
    } catch (error) {
      console.error('Error loading real vault data:', error);
    } finally {
      setIsLoadingVaultData(false);
    }
  }, [user, vaults, isLoadingVaultData]);

  // Load user shares và total deposited cho vault được chọn
  const loadUserData = useCallback(async () => {
    if (!selectedVault || !user) return;

    // Skip real contract calls for fake vaults
    if (!selectedVault.isReal) {
      console.log(`🎭 Fake vault ${selectedVault.name} - using mockup user data`);
      
      // Use mockup data for fake vaults
      const mockShares = Math.floor(Math.random() * 1000) + 100;
      const mockTotalDeposited = mockShares * (selectedVault.totalDeposits / selectedVault.totalShares);
      
      setUserShares(mockShares);
      setUserTotalDeposited(mockTotalDeposited);
      
      console.log('✅ Fake vault user data loaded:', { shares: mockShares, totalDeposited: mockTotalDeposited });
      return;
    }
    
    // Only load real data for real vaults
    console.log('👤 Loading real user data for vault:', selectedVault.name);
    
    try {
      await vaultService.initializeContracts(selectedVault.vaultAddress, selectedVault.tokenAddress);
      
      const userAddress = user.walletType === 'hashpack' ? user.accountId : user.walletAddress;
      
      const [shares, totalDeposited] = await Promise.all([
        vaultService.getUserShares(selectedVault.vaultAddress, userAddress),
        vaultService.getUserTotalDeposited(selectedVault.vaultAddress, userAddress)
      ]);
      
      setUserShares(shares);
      setUserTotalDeposited(totalDeposited);
      
      console.log('✅ Real user data loaded:', { shares, totalDeposited });
    } catch (error) {
      console.error('❌ Error loading real user data:', error);
      setUserShares(0);
      setUserTotalDeposited(0);
    }
  }, [selectedVault, user]);

  // Load top traders
  const loadTopTraders = useCallback(async () => {
    if (!selectedVault) return;

    try {
      // Skip real contract calls for fake vaults
      if (!selectedVault.isReal) {
        console.log(`🎭 Fake vault ${selectedVault.name} - using mockup top traders data`);
        
        // Use mockup data for fake vaults
        const mockTraders: TraderInfo[] = [
          {
            address: "0x1234567890123456789012345678901234567890",
            shares: 50000,
            totalDeposited: 50000,
            lastTransaction: Date.now() - 86400000, // 1 day ago
            transactionCount: 15
          },
          {
            address: "0x2345678901234567890123456789012345678901",
            shares: 35000,
            totalDeposited: 35000,
            lastTransaction: Date.now() - 172800000, // 2 days ago
            transactionCount: 12
          },
          {
            address: "0x3456789012345678901234567890123456789012",
            shares: 25000,
            totalDeposited: 25000,
            lastTransaction: Date.now() - 259200000, // 3 days ago
            transactionCount: 8
          }
        ];
        
        setTopTraders(mockTraders);
        console.log('✅ Fake vault top traders loaded:', mockTraders);
        return;
      }
      
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
      // Skip real contract calls for fake vaults
      if (!selectedVault.isReal) {
        console.log(`🎭 Fake vault ${selectedVault.name} - using mockup transaction history`);
        
        // Use mockup data for fake vaults
        const mockTransactions: Transaction[] = [
          {
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
            from: "0x1234567890123456789012345678901234567890",
            to: selectedVault.vaultAddress,
            value: "1000000000000000000", // 1 token in wei
            timestamp: Date.now() - 3600000, // 1 hour ago
            type: "deposit",
            blockNumber: 12345678
          },
          {
            hash: "0x2345678901234567890123456789012345678901234567890123456789012345",
            from: selectedVault.vaultAddress,
            to: "0x2345678901234567890123456789012345678901",
            value: "500000000000000000", // 0.5 token in wei
            timestamp: Date.now() - 7200000, // 2 hours ago
            type: "withdraw",
            blockNumber: 12345677
          },
          {
            hash: "0x3456789012345678901234567890123456789012345678901234567890123456",
            from: "0x3456789012345678901234567890123456789012",
            to: selectedVault.vaultAddress,
            value: "2000000000000000000", // 2 tokens in wei
            timestamp: Date.now() - 10800000, // 3 hours ago
            type: "deposit",
            blockNumber: 12345676
          }
        ];
        
        setTransactionHistory(mockTransactions);
        console.log('✅ Fake vault transaction history loaded:', mockTransactions);
        return;
      }
      
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
      isRealVault: selectedVault.isReal
    });

    setIsLoading(true);
    try {
      // Handle fake vault deposits with mockup data
      if (!selectedVault.isReal) {
        console.log(`🎭 Fake vault ${selectedVault.name} - simulating deposit`);
        
        // Simulate deposit delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update mockup data
        const newShares = Math.floor(amount * (selectedVault.totalShares / selectedVault.totalDeposits));
        const newTotalDeposited = userTotalDeposited + amount;
        
        setUserShares(prev => prev + newShares);
        setUserTotalDeposited(prev => prev + amount);
        
        // Update vault mockup data
        setVaults(prev => prev.map(v => 
          v.id === selectedVault.id 
            ? {
                ...v,
                totalDeposits: v.totalDeposits + amount,
                totalShares: v.totalShares + newShares,
                shareholderCount: v.shareholderCount + (userShares === 0 ? 1 : 0) // Add shareholder if first deposit
              }
            : v
        ));
        
        toast({
          title: "Success",
          description: `Successfully deposited ${amount} ${selectedVault.token} to ${selectedVault.name}`,
        });
        
        console.log('✅ Fake vault deposit completed:', { newShares, newTotalDeposited });
        return;
      }

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
  }, [selectedVault, user, userTokenBalance, userShares, userTotalDeposited, loadVaultData, loadUserData, loadTopTraders, loadTransactionHistory]);

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
      // Handle fake vault withdrawals with mockup data
      if (!selectedVault.isReal) {
        console.log(`🎭 Fake vault ${selectedVault.name} - simulating withdrawal`);
        
        // Simulate withdrawal delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update mockup data
        const withdrawalAmount = amount * (selectedVault.totalDeposits / selectedVault.totalShares);
        const newShares = userShares - amount;
        const newTotalDeposited = userTotalDeposited - withdrawalAmount;
        
        setUserShares(newShares);
        setUserTotalDeposited(newTotalDeposited);
        
        // Update vault mockup data
        setVaults(prev => prev.map(v => 
          v.id === selectedVault.id 
            ? {
                ...v,
                totalDeposits: v.totalDeposits - withdrawalAmount,
                totalShares: v.totalShares - amount,
                shareholderCount: v.shareholderCount - (newShares === 0 ? 1 : 0) // Remove shareholder if no shares left
              }
            : v
        ));
        
        toast({
          title: "Success",
          description: `Successfully withdrawn ${amount} shares from ${selectedVault.name}`,
        });
        
        console.log('✅ Fake vault withdrawal completed:', { newShares, newTotalDeposited, withdrawalAmount });
        return;
      }

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
  }, [selectedVault, user, userShares, userTotalDeposited, loadVaultData, loadUserData, loadTopTraders, loadTransactionHistory]);

  // Kiểm tra trạng thái withdraw
  const checkWithdrawStatus = useCallback(async () => {
    if (!selectedVault) return;

    try {
      // Handle fake vault withdraw status
      if (!selectedVault.isReal) {
        console.log(`🎭 Fake vault ${selectedVault.name} - using mockup withdraw status`);
        
        const mockStatus: WithdrawStatus = {
          canWithdraw: selectedVault.withdrawalsEnabled,
          isProcessing: false,
          message: selectedVault.withdrawalsEnabled 
            ? 'Withdrawals are enabled for this vault' 
            : 'Withdrawals are not yet enabled for this vault',
          timeRemaining: selectedVault.withdrawalsEnabled ? undefined : '2 days remaining'
        };
        
        setWithdrawStatus(mockStatus);
        console.log('✅ Fake vault withdraw status loaded:', mockStatus);
        return;
      }
      
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
      // Handle fake vault withdraw requests
      if (!selectedVault.isReal) {
        console.log(`🎭 Fake vault ${selectedVault.name} - simulating withdraw request`);
        
        // Simulate withdraw request delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        toast({
          title: "Withdraw Request Sent",
          description: "Your withdraw request is being processed...",
        });
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Withdraw Successful",
          description: `Withdraw request processed for ${selectedVault.name}`,
        });
        
        console.log('✅ Fake vault withdraw request completed');
        return;
      }
      
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
          // ✅ Sử dụng timestamp hợp lệ thay vì 0
          runTimestamp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 năm từ bây giờ
          stopTimestamp: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60), // 2 năm từ bây giờ
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

  // Load data khi user thay đổi (chỉ 1 lần)
  useEffect(() => {
    if (user && vaults.length > 0) {
      console.log('🔄 Initial vault data load');
      loadVaultData();
    }
  }, [user, vaults.length]); // Removed loadVaultData dependency

  // Load user data khi chọn vault (chỉ khi vault thay đổi)
  useEffect(() => {
    if (selectedVault && user) {
      console.log('🔄 Loading user data for selected vault:', selectedVault.name);
      loadUserData();
    }
  }, [selectedVault?.id, user]); // Only depend on selectedVault.id

  // Effect để kiểm tra withdraw status khi selected vault thay đổi
  useEffect(() => {
    if (selectedVault) {
      checkWithdrawStatus();
    }
  }, [selectedVault?.id]);

  // Add realtime interval for real vault updates
  useEffect(() => {
    if (!user || !vaults.some(v => v.isReal)) return;

    console.log('🔄 Starting realtime updates for real vault');
    
    const interval = setInterval(() => {
      loadVaultData();
    }, 30000); // Update every 30 seconds

    return () => {
      console.log('🛑 Stopping realtime updates');
      clearInterval(interval);
    };
  }, [user, vaults, loadVaultData]);

  return {
    vaults, selectedVault, setSelectedVault, userShares, userTotalDeposited, userTokenBalance,
    vaultStates, topTraders, transactionHistory, isLoading, isRefreshing, withdrawStatus, isWithdrawing,
    loadVaultData, loadUserData, loadTopTraders, loadTransactionHistory, deposit, approveToken, withdraw, requestWithdraw, checkWithdrawStatus
  };
};

export { vaultService }; 