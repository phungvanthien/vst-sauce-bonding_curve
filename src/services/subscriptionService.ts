import { TransferTransaction } from "@hashgraph/sdk";
import { ethers } from 'ethers';
import { getAccountBalance } from '@/utils/account-utils';
import { 
  toSmallestUnits, 
  toHumanReadable, 
  waitForTransactionConfirmation
} from '@/utils/token-utils';

// Token ABI for VST token operations
const VST_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  token: string;
  duration: number; // in days
  features: string[];
}

export interface SubscriptionPayment {
  planName: string;
  amount: number;
  tokenAddress: string;
  recipientAddress: string;
  transactionHash?: string;
  timestamp?: number;
  status: 'pending' | 'completed' | 'failed' | 'user_rejected';
}

export interface SubscriptionServiceConfig {
  // Network Configuration
  rpcUrl?: string;
  
  // API Configuration
  baseUrl?: string;
  
  // Subscription Configuration
  vstTokenId?: string;
  vstTokenAddress?: string;
  subscriptionWalletAddress?: string;
  subscriptionWalletAccountId?: string; // For HashPack operations
  
  // Runtime State
  manager?: any;
  pairingData?: any;
  
  // Wallet Configuration
  walletType?: 'hashpack' | 'evm';
  evmSigner?: any;
  
  // Internal State
  ethersProvider?: any;
  signer?: any;
  isInitialized?: boolean;
}

/**
 * SubscriptionService - Service for handling subscription payments with VST tokens
 * 
 * This service provides functionality for processing subscription payments
 * by transferring VST tokens to a subscription wallet address.
 */
export class SubscriptionService {
  // Configuration (contains all properties)
  private config: SubscriptionServiceConfig;
  private readonly DEFAULT_CONFIG: SubscriptionServiceConfig = {
    // Network Configuration
    rpcUrl: 'https://mainnet.hashio.io/api',
    
    // API Configuration
    baseUrl: 'http://localhost:8000/api/v2_2/',
    
    // Subscription Configuration
    vstTokenId: import.meta.env.VITE_NATIVE_TOKEN_ID,
    vstTokenAddress: import.meta.env.VITE_NATIVE_TOKEN_ADDRESS,
    subscriptionWalletAddress: import.meta.env.VITE_RECEIVER_ADDRESS,
    subscriptionWalletAccountId: import.meta.env.VITE_RECEIVER_ACCOUNT_ID,
    
    // Runtime State
    manager: null,
    pairingData: null,
    
    // Wallet Configuration
    walletType: 'hashpack',
    evmSigner: null,
    
    // Internal State
    ethersProvider: null,
    signer: null,
    isInitialized: false
  };

  constructor(config: SubscriptionServiceConfig = {}) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    
    // Initialize signer if manager and pairingData are provided
    if (config.manager && config.pairingData) {
      this.config.signer = this.getSigner(config.manager, config.pairingData);
    }
  }

  /**
   * Initialize subscription service configuration
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing SubscriptionService...');
      
      // Validate required configuration
      if (!this.config.vstTokenAddress) {
        throw new Error('VST token address not configured');
      }
      
      if (!this.config.subscriptionWalletAddress) {
        throw new Error('Subscription wallet address not configured');
      }
      
      // Mark as initialized
      this.config.isInitialized = true;
      
      console.log('✅ SubscriptionService initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SubscriptionService:', error);
      throw error;
    }
  }

  // ============================================================================
  // CORE SETUP & CONFIGURATION
  // ============================================================================

  /**
   * Set signer after construction (if not provided in constructor)
   */
  setSigner(signer: any): void {
    this.config.signer = signer;
  }

  /**
   * Set manager and pairing data to initialize signer
   */
  setManagerAndPairingData(manager: any, pairingData: any): void {
    this.config.manager = manager;
    this.config.pairingData = pairingData;
    this.config.signer = this.getSigner(manager, pairingData);
    this.config.walletType = 'hashpack';
  }

  /**
   * Set EVM signer for EVM wallet operations
   */
  setEVMSigner(evmSigner: any): void {
    this.config.evmSigner = evmSigner;
    this.config.walletType = 'evm';
  }

  /**
   * Set wallet type explicitly
   */
  setWalletType(walletType: 'hashpack' | 'evm'): void {
    this.config.walletType = walletType;
  }

  /**
   * Set base URL for API endpoints
   */
  setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl || 'not configured';
  }

  /**
   * Get EVM wallet address
   */
  async getEVMWalletAddress(): Promise<string | null> {
    try {
      if (this.config.evmSigner) {
        return await this.config.evmSigner.getAddress();
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting EVM wallet address:', error);
      return null;
    }
  }

  /**
   * Get signer from manager and pairing data
   */
  private getSigner(manager: any, pairingData: any): any {
    return manager.getSigner(pairingData.accountIds[0]);
  }

  // ============================================================================
  // PROVIDER MANAGEMENT
  // ============================================================================

  /**
   * Get or create ethers provider
   */
  private getEthersProvider(): ethers.providers.JsonRpcProvider {
    if (!this.config.ethersProvider) {
      this.config.ethersProvider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
    }
    return this.config.ethersProvider;
  }

  /**
   * Ensure provider is available
   */
  private async ensureProvider(): Promise<void> {
    if (!this.config.signer) {
      throw new Error('Signer not configured');
    }
  }

  // ============================================================================
  // TOKEN BALANCE & ALLOWANCE MANAGEMENT
  // ============================================================================

  /**
   * Get VST token balance for user
   */
  async getVSTBalance(userAddress: string): Promise<number> {
    try {
      if (this.config.walletType === 'evm') {
        return await this.getVSTBalanceEVM(userAddress);
      } else {
        // HashPack implementation using account-utils
        return await this.getVSTBalanceHashPack(userAddress);
      }
    } catch (error) {
      console.error('❌ Error getting VST balance:', error);
      throw error;
    }
  }

  /**
   * Get VST token balance using EVM wallet
   */
  private async getVSTBalanceEVM(userAddress: string): Promise<number> {
    try {
      if (!this.config.evmSigner) {
        throw new Error('EVM signer not configured');
      }

      if (!this.config.vstTokenAddress) {
        throw new Error('VST token address not configured');
      }

      // Create VST token contract instance
      const vstContract = new ethers.Contract(
        this.config.vstTokenAddress,
        VST_TOKEN_ABI,
        this.config.evmSigner
      );

      // Get balance
      const balance = await vstContract.balanceOf(userAddress);
      const balanceFormatted = await toHumanReadable(balance.toString(), this.config.vstTokenAddress);
      
      return balanceFormatted;
    } catch (error) {
      console.error('❌ Error getting VST balance (EVM):', error);
      throw error;
    }
  }

  /**
   * Get VST token balance using HashPack wallet
   */
  private async getVSTBalanceHashPack(userAddress: string): Promise<number> {
    try {
      if (!this.config.vstTokenAddress) {
        throw new Error('VST token address not configured');
      }

      // Use account-utils to get token balance (returns raw balance in smallest units)
      const balanceRaw = await getAccountBalance(userAddress as `0.0.${string}`, this.config.vstTokenAddress as `0.0.${string}`);
      
      // Convert from smallest units to human-readable format
      const balanceFormatted = await toHumanReadable(balanceRaw, this.config.vstTokenAddress);
      
      return balanceFormatted;
    } catch (error) {
      console.error('❌ Error getting VST balance (HashPack):', error);
      throw error;
    }
  }

  // ============================================================================
  // SUBSCRIPTION PAYMENT PROCESSING
  // ============================================================================

  /**
   * Check if error is due to user rejection of transaction
   */
  private isUserRejectionError(error: any): boolean {
    if (!error) return false;
    
    // Check for HashPack specific error structure
    if (error.code === 9000 && error.message === 'USER_REJECT') {
      return true;
    }
    
    // Check for EVM wallet specific error structures
    if (error.code === 4001) { // User rejected the request
      return true;
    }
    
    if (error.message && (
      error.message.includes('User denied') ||
      error.message.includes('User rejected') ||
      error.message.includes('User cancelled') ||
      error.message.includes('cancelled by user')
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Process subscription payment (supports both HashPack and EVM wallets)
   * @param planName - Name of the subscription plan
   * @param amount - Amount to pay
   * @param userAddress - User's wallet address/account ID (for blockchain operations)
   * @param userAccountId - User's account ID on Hedera (for blockchain operations)
   * @param userId - User's database ID (for database operations)
   */
  async processSubscriptionPayment(planName: string, amount: number, userAddress: string, userAccountId: string, userId: number): Promise<SubscriptionPayment> {
    try {
      console.log(`💳 Processing subscription payment for plan: ${planName}, amount: ${amount} VST, userAddress: ${userAddress}`);
      
      // Validate inputs
      if (!planName || amount <= 0 || !userAddress) {
        throw new Error('Invalid payment parameters');
      }

      // Check user balance with detailed error message
      const balance = await this.getVSTBalance(userAddress);
      if (balance < amount) {
        throw new Error(`Insufficient VST balance. You have ${balance} VST but need ${amount} VST`);
      }

      // Determine wallet type and route to appropriate implementation
      if (this.config.walletType === 'evm') {
        return await this.processSubscriptionPaymentEVM(planName, amount, userId);
      } else {
        // HashPack implementation
        return await this.processSubscriptionPaymentHashPack(planName, amount, userAccountId, userId);
      }
    } catch (error) {
      console.error('❌ Error processing subscription payment:', error);
      
      // Check if this is a user rejection error
      if (this.isUserRejectionError(error)) {
        return {
          planName,
          amount,
          tokenAddress: this.config.vstTokenAddress || '',
          recipientAddress: this.config.subscriptionWalletAddress || '',
          timestamp: Date.now(),
          status: 'user_rejected'
        };
      }
      
      throw error;
    }
  }

  /**
   * Process subscription payment using EVM wallet
   */
  private async processSubscriptionPaymentEVM(planName: string, amount: number, userId: number): Promise<SubscriptionPayment> {
    try {
      if (!this.config.evmSigner) {
        throw new Error('EVM signer not configured');
      }

      if (!this.config.vstTokenAddress || !this.config.subscriptionWalletAddress) {
        throw new Error('VST token address or subscription wallet address not configured');
      }

      // Convert amount to smallest units using token-utils
      const amountSmallest = await toSmallestUnits(amount, this.config.vstTokenAddress);

      // Create VST token contract instance
      const vstContract = new ethers.Contract(
        this.config.vstTokenAddress,
        VST_TOKEN_ABI,
        this.config.evmSigner
      );

      // Execute transfer
      console.log('[processSubscriptionPaymentEVM] Executing VST transfer...');
      const tx = await vstContract.transfer(
        this.config.subscriptionWalletAddress,
        amountSmallest
      );

      console.log('📤 VST transfer transaction sent:', tx.hash);

      // Step 1: Create/update subscription immediately after transaction is signed
      try {
        await this.createOrUpdateSubscriptionAfterSign(
          userId, // Use database user ID
          this.getPlanIdFromName(planName),
          tx.hash
        );
      } catch (dbError) {
        console.warn('⚠️ Payment sent but failed to create subscription record:', dbError);
        // Continue with payment processing even if database fails
      }

      // Wait for transaction confirmation using token-utils
      try {
        await waitForTransactionConfirmation(tx.hash);
        console.log('✅ VST transfer confirmed:', tx.hash);
        
        // Step 2: Update subscription with dates after transaction is confirmed
        try {
          await this.updateSubscriptionAfterConfirmation(
            userId, // Use database user ID
            tx.hash
          );
        } catch (dbError) {
          console.warn('⚠️ Payment confirmed but failed to update subscription dates:', dbError);
          // Don't fail the payment if database update fails
        }
      } catch (confirmationError) {
        console.log('[processSubscriptionPaymentEVM] Confirmation error:', confirmationError);
        console.warn('⚠️ Transaction confirmation timeout, but transaction was sent:', tx.hash);
      }
      
      return {
        planName,
        amount,
        tokenAddress: this.config.vstTokenAddress,
        recipientAddress: this.config.subscriptionWalletAddress,
        transactionHash: tx.hash,
        timestamp: Date.now(),
        status: 'completed'
      };
    } catch (error) {
      console.error('❌ Error processing subscription payment (EVM):', error);
      
      // Check if this is a user rejection error
      if (this.isUserRejectionError(error)) {
        return {
          planName,
          amount,
          tokenAddress: this.config.vstTokenAddress || '',
          recipientAddress: this.config.subscriptionWalletAddress || '',
          timestamp: Date.now(),
          status: 'user_rejected'
        };
      }
      
      throw error;
    }
  }

  /**
   * Process subscription payment using HashPack wallet
   */
  private async processSubscriptionPaymentHashPack(planName: string, amount: number, userAccountId: string, userId: number): Promise<SubscriptionPayment> {
    try {
      await this.ensureProvider();
      
      if (!this.config.vstTokenId || !this.config.subscriptionWalletAccountId) {
        throw new Error('VST token address or subscription wallet address not configured');
      }

       // Convert amount to smallest units using token-utils
       const amountSmallest = await toSmallestUnits(amount, this.config.vstTokenId);

       // Use account ID if available, otherwise use wallet address
       const vstTokenId = this.config.vstTokenId;
       const recipientAccountId = this.config.subscriptionWalletAccountId;

       // Create token transfer transaction
       console.log('[processSubscriptionPaymentHashPack] Start building transaction for userAccountId:', userAccountId);
       const transferTransaction = new TransferTransaction()
         .addTokenTransfer(
           vstTokenId,
           userAccountId, // Use user's wallet account ID for blockchain operations
           -amountSmallest
         )
         .addTokenTransfer(
           vstTokenId,
           recipientAccountId,
           amountSmallest
         )
         .setTransactionMemo(`Subscription payment for ${planName}`);

      // Execute transaction
      console.log('[processSubscriptionPaymentHashPack] Start freezing transaction');
      const frozenTransaction = await transferTransaction.freezeWithSigner(this.config.signer);
      
      let response;
      try {
        response = await frozenTransaction.executeWithSigner(this.config.signer);
      } catch (executeError) {
        // Check if this is a user rejection error
        if (this.isUserRejectionError(executeError)) {
          return {
            planName,
            amount,
            tokenAddress: this.config.vstTokenAddress || '',
            recipientAddress: this.config.subscriptionWalletAccountId || '',
            timestamp: Date.now(),
            status: 'user_rejected'
          };
        }
        
        // Re-throw if not user rejection
        throw executeError;
      }
      
      console.log('📤 VST transfer transaction sent:', response.transactionId.toString());

      // Step 1: Create/update subscription immediately after transaction is signed
      try {
        await this.createOrUpdateSubscriptionAfterSign(
          userId, // Use database user ID for database operations
          this.getPlanIdFromName(planName),
          response.transactionId.toString()
        );
      } catch (dbError) {
        console.warn('⚠️ Payment sent but failed to create subscription record:', dbError);
        // Continue with payment processing even if database fails
      }

      // Wait for transaction confirmation using token-utils
      try {
        await waitForTransactionConfirmation(response.transactionId.toString());
        console.log('✅ VST transfer confirmed:', response.transactionId.toString());
        
        // Step 2: Update subscription with dates after transaction is confirmed
        try {
          await this.updateSubscriptionAfterConfirmation(
            userId, // Use database user ID for database operations
            response.transactionId.toString()
          );
        } catch (dbError) {
          console.warn('⚠️ Payment confirmed but failed to update subscription dates:', dbError);
          // Don't fail the payment if database update fails
        }
      } catch (confirmationError) {
        console.log('[processSubscriptionPaymentHashPack] Confirmation error:', confirmationError);
        console.warn('⚠️ Transaction confirmation timeout, but transaction was sent:', response.transactionId.toString());
      }

       return {
         planName,
         amount,
         tokenAddress: this.config.vstTokenAddress,
         recipientAddress: recipientAccountId,
         transactionHash: response.transactionId.toString(),
         timestamp: Date.now(),
         status: 'completed'
       };
    } catch (error) {
      console.error('❌ Error processing subscription payment (HashPack):', error);
      
      // Check if this is a user rejection error
      if (this.isUserRejectionError(error)) {
        return {
          planName,
          amount,
          tokenAddress: this.config.vstTokenAddress || '',
          recipientAddress: this.config.subscriptionWalletAccountId || '',
          timestamp: Date.now(),
          status: 'user_rejected'
        };
      }
      
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate precise date addition in milliseconds
   */
  private addDaysToDate(date: Date, days: number): Date {
    const daysInMs = days * 24 * 60 * 60 * 1000;
    return new Date(date.getTime() + daysInMs);
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  /**
   * Handle transaction failure by updating subscription status
   * @param userId - User ID
   * @param transactionHash - Transaction hash
   * @param status - Status to set (default: 'canceled')
   */
  async handleTransactionFailure(
    userId: number,
    transactionHash: string,
    status: string = 'canceled'
  ): Promise<any> {
    try {
      console.log(`❌ Handling transaction failure for user: ${userId}, tx: ${transactionHash}, status: ${status}`);
      
      return await this.updateSubscriptionAfterConfirmation(
        userId,
        transactionHash,
        status
      );
    } catch (error) {
      console.error('❌ Error handling transaction failure:', error);
      throw error;
    }
  }

  /**
   * Step 1: Create or update user subscription immediately after transaction is signed
   * Status: 'pending-tx' - Transaction is signed but not yet confirmed on blockchain
   */
  async createOrUpdateSubscriptionAfterSign(
    userId: number,
    planId: number,
    transactionHash: string
  ): Promise<any> {
    console.log('💾 Creating/updating subscription after sign:', transactionHash);
    try {
      // Calculate start date (current time)
      const startDate = new Date();
      
      const subscriptionData = {
        user_id: userId,
        plan_id: planId,
        transaction_hash: transactionHash,
        status: 'pending-tx', // Transaction is signed but not yet confirmed
        start_date: startDate.toISOString()
      };

      console.log('💾 Creating/updating subscription after sign:', subscriptionData);

      const response = await fetch(`${this.config.baseUrl}subscription/subscriptions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        let errorMessage = `Failed to create/update subscription: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = `Failed to create/update subscription: ${errorData.message || response.statusText}`;
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Subscription created/updated after sign:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error creating/updating subscription after sign:', error);
      throw error;
    }
  }

  /**
   * Step 2: Update user subscription with dates after transaction is confirmed
   * @param userId - User ID
   * @param transactionHash - Transaction hash
   * @param status - Subscription status ('active', 'canceled', 'expired', etc.)
   */
  async updateSubscriptionAfterConfirmation(
    userId: number,
    transactionHash: string,
    status: string = 'active'
  ): Promise<any> {
    console.log('💾 Updating subscription after confirmation:', transactionHash);
    try {
      let updateData: any = {
        transaction_hash: transactionHash,
        status: status
      };

      // Only add dates if status is 'active'
      if (status === 'active') {
        // Get current time for end date calculation
        const currentTime = new Date();
        
        // Add exactly 30 days to current time for end date and renewal
        const endDate = this.addDaysToDate(currentTime, 30);
        const renewalAt = this.addDaysToDate(currentTime, 30);

        updateData = {
          ...updateData,
          end_date: endDate.toISOString(),
          renewal_at: renewalAt.toISOString()
        };
      }

      console.log('💾 Updating subscription after confirmation:', updateData);
      
      if (status === 'active') {
        console.log('📅 Date calculation details:', {
          currentTime: new Date().toISOString(),
          endDate: updateData.end_date,
          renewalAt: updateData.renewal_at,
          durationInMs: 30 * 24 * 60 * 60 * 1000,
          durationInDays: 30
        });
      } else {
        console.log(`❌ Subscription ${status} - no dates calculated`);
      }

      const response = await fetch(`${this.config.baseUrl}subscription/subscriptions/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        let errorMessage = `Failed to update subscription: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = `Failed to update subscription: ${errorData.message || response.statusText}`;
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Subscription updated after confirmation:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error updating subscription after confirmation:', error);
      throw error;
    }
  }

  // ============================================================================
  // SUBSCRIPTION PLAN MANAGEMENT
  // ============================================================================

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        id: 1,
        name: "Premium Plan",
        price: 1,
        token: "VST",
        duration: 30, // 30 days
        features: [
          "Access to all vault strategies",
          "Advanced analytics dashboard",
          "Priority customer support",
          "Real-time market data",
          "Portfolio optimization tools",
          "Exclusive trading signals",
        ]
      },
      {
        id: 2,
        name: "Pro Plan",
        price: 200,
        token: "VST",
        duration: 30,
        features: [
          "All Premium features",
          "Advanced charting tools",
          "Backtesting capabilities",
          "Custom indicators",
          "Portfolio rebalancing",
          "Tax reporting tools",
        ]
      },
      {
        id: 3,
        name: "Enterprise Plan",
        price: 500,
        token: "VST",
        duration: 30,
        features: [
          "All Premium features",
          "Custom vault strategies",
          "API access",
          "Dedicated account manager",
          "White-label solutions",
          "Advanced risk management",
        ]
      }
    ];
  }

  /**
   * Get subscription plan by ID
   */
  getSubscriptionPlan(planId: number): SubscriptionPlan | null {
    const plans = this.getSubscriptionPlans();
    return plans.find(plan => plan.id === planId) || null;
  }

  /**
   * Get plan ID from plan name
   */
  private getPlanIdFromName(planName: string): number {
    const plans = this.getSubscriptionPlans();
    const plan = plans.find(p => p.name === planName);
    return plan ? plan.id : 1; // Default to Premium Plan (ID: 1)
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return `${amount} VST`;
  }

  /**
   * Validate subscription plan
   */
  validatePlan(planId: number): boolean {
    const plan = this.getSubscriptionPlan(planId);
    return plan !== null;
  }

   /**
    * Get service status
    */
   getStatus(): { 
     initialized: boolean; 
     walletType: string; 
     baseUrl: string;
     vstTokenAddress: string;
     subscriptionWalletAddress: string;
     subscriptionWalletAccountId: string;
     evmSignerConfigured: boolean;
   } {
     return {
       initialized: this.config.isInitialized || false,
       walletType: this.config.walletType || 'none',
       baseUrl: this.config.baseUrl || 'not configured',
       vstTokenAddress: this.config.vstTokenAddress || 'not configured',
       subscriptionWalletAddress: this.config.subscriptionWalletAddress || 'not configured',
       subscriptionWalletAccountId: this.config.subscriptionWalletAccountId || 'not configured',
       evmSignerConfigured: !!this.config.evmSigner
     };
   }
}
