import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useHashConnect } from '@/contexts/HashConnectContext';
import { toast } from '@/hooks/use-toast';
import { useVault } from '@/hooks/useVault';
import { vaultService } from '@/services/vaultService';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Clock, 
  Lock, 
  Unlock, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Shield,
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

const Vault: React.FC = () => {
  const { user } = useAuth();
  const { connectionState, pairingData } = useHashConnect();
  const {
    vaults,
    selectedVault,
    setSelectedVault,
    userShares,
    userTotalDeposited,
    userTokenBalance,
    vaultStates,
    topTraders,
    transactionHistory,
    isLoading,
    isRefreshing,
    loadVaultData,
    loadUserData,
    deposit,
    approveToken,
    withdraw
  } = useVault();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);

  // Xử lý deposit
  const handleDeposit = async () => {
    if (!depositAmount) {
      toast({
        title: "Error",
        description: "Please enter deposit amount",
        variant: "destructive"
      });
      return;
    }

    try {
      await deposit(parseFloat(depositAmount));
      setDepositAmount('');
      setShowDepositForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deposit",
        variant: "destructive"
      });
    }
  };

  // Xử lý withdraw
  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      toast({
        title: "Error",
        description: "Please enter withdrawal amount",
        variant: "destructive"
      });
      return;
    }

    try {
      await withdraw(parseFloat(withdrawAmount));
      setWithdrawAmount('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to withdraw",
        variant: "destructive"
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyrus-text">Vault Management</h1>
          <p className="text-cyrus-textSecondary mt-2">
            Manage your investments across different vault strategies
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-cyrus-accent" />
            <span className="text-sm text-cyrus-textSecondary">
              {user?.walletType === 'hashpack' ? 'HashPack' : 'MetaMask'} Connected
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadVaultData}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* User Balance */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Your Token Balance</h3>
                <p className="text-sm text-cyrus-textSecondary">
                  Available for vault deposits
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{vaultService.formatAmount(userTokenBalance)}</div>
                <div className="text-sm text-cyrus-textSecondary">USD</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="vaults" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vaults">Available Vaults</TabsTrigger>
          <TabsTrigger value="my-vaults">My Vaults</TabsTrigger>
          <TabsTrigger value="traders">Top Traders</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="vaults" className="space-y-6">
          {/* Vault List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault) => {
              const runTimeRemaining = vaultService.getTimeRemaining(vault.runTimestamp);
              const stopTimeRemaining = vaultService.getTimeRemaining(vault.stopTimestamp);
              
              return (
                <Card 
                  key={vault.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedVault?.id === vault.id ? 'ring-2 ring-cyrus-accent' : ''
                  }`}
                  onClick={() => setSelectedVault(vault)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vault.name}</CardTitle>
                      <Badge 
                        variant={vault.status === 'active' ? 'default' : 'secondary'}
                        className={vault.depositsClosed ? 'bg-orange-500' : 'bg-green-500'}
                      >
                        {vault.depositsClosed ? 'Deposits Closed' : 'Active'}
                      </Badge>
                    </div>
                    <CardDescription>{vault.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* APY và Risk */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{vault.apy}% APY</span>
                      </div>
                      <Badge variant="outline" className={
                        vault.riskLevel === 'Low' ? 'border-green-500 text-green-500' :
                        vault.riskLevel === 'Medium' ? 'border-yellow-500 text-yellow-500' :
                        'border-red-500 text-red-500'
                      }>
                        {vault.riskLevel} Risk
                      </Badge>
                    </div>

                    {/* Total Deposits */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cyrus-textSecondary">Total Deposits</span>
                      <span className="font-medium">{vaultService.formatAmount(vault.totalDeposits)}</span>
                    </div>

                    {/* Shareholders */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cyrus-textSecondary">Shareholders</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{vault.shareholderCount}/{vault.maxShareholders}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <Progress 
                      value={(vault.shareholderCount / vault.maxShareholders) * 100} 
                      className="h-2"
                    />

                    {/* Timestamps */}
                    <div className="space-y-2 text-xs text-cyrus-textSecondary">
                      <div className="flex items-center justify-between">
                        <span>Deposits Close:</span>
                        <span>{vaultService.formatTimestamp(vault.runTimestamp)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Withdrawals Open:</span>
                        <span>{vaultService.formatTimestamp(vault.stopTimestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected Vault Details */}
          {selectedVault && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {selectedVault.name} - Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Vault Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vault Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-cyrus-textSecondary">Token:</span>
                        <span className="font-medium">{selectedVault.token}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyrus-textSecondary">Total Deposits:</span>
                        <span className="font-medium">{vaultService.formatAmount(selectedVault.totalDeposits)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyrus-textSecondary">Total Shares:</span>
                        <span className="font-medium">{selectedVault.totalShares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyrus-textSecondary">Your Shares:</span>
                        <span className="font-medium">{userShares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyrus-textSecondary">Your Total Deposited:</span>
                        <span className="font-medium text-green-500">{vaultService.formatAmount(userTotalDeposited)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyrus-textSecondary">APY:</span>
                        <span className="font-medium text-green-500">{selectedVault.apy}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Deposit Form */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Quick Actions</h3>
                    
                    {/* Deposit Button */}
                    {!selectedVault.depositsClosed && (
                      <div className="space-y-4">
                        {!showDepositForm ? (
                          <Button 
                            onClick={() => setShowDepositForm(true)}
                            className={`w-full ${
                              selectedVault.id === 4 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            disabled={isLoading}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            {selectedVault.id === 4 ? 'Deposit to Real Vault' : 'Deposit to Vault'}
                          </Button>
                        ) : (
                          <div className="space-y-3 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="deposit-amount">Amount ({selectedVault.token})</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDepositForm(false)}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              id="deposit-amount"
                              type="number"
                              placeholder="Enter amount"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              disabled={isLoading}
                              min="0.000001"
                              max="1000000"
                              step="0.000001"
                            />
                            <p className="text-xs text-gray-500">
                              Min: 0.000001 {selectedVault.token} • Max: 1,000,000 {selectedVault.token}
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleDeposit}
                                disabled={isLoading || !depositAmount}
                                className={`flex-1 ${
                                  selectedVault.isReal 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {isLoading ? 'Processing...' : (selectedVault.isReal ? 'Confirm Real Deposit' : 'Confirm Deposit')}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => setShowDepositForm(false)}
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                            {selectedVault.isReal && (
                              <div className="space-y-2">
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                  ⚠️ <strong>Real Smart Contract:</strong> This will execute a real transaction on Hedera network. 
                                  Make sure you have sufficient balance and understand the risks.
                                </div>
                                
                                {/* Debug Mirror Node Direct */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      const userAccountId = user?.accountId || user?.walletAddress;
                                      if (!userAccountId) {
                                        toast({
                                          title: "Error",
                                          description: "No user account found",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      const mirrorUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${userAccountId}`;
                                      console.log('🔍 Direct Mirror Node check:', mirrorUrl);
                                      
                                      const response = await fetch(mirrorUrl);
                                      if (!response.ok) {
                                        console.error('Mirror Node Error:', response.status, response.statusText);
                                        const errorText = await response.text();
                                        console.error('Error details:', errorText);
                                        
                                        toast({
                                          title: "Mirror Node Error",
                                          description: `Status: ${response.status} - ${response.statusText}`,
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      const data = await response.json();
                                      console.log('📊 Mirror Node Response:', data);
                                      
                                      const tokens = data?.tokens || [];
                                      console.log('🪙 Available tokens:', tokens);
                                      
                                      const tokenCount = tokens.length;
                                      const hasUSDC = tokens.find((t: any) => 
                                        t.token_id?.includes('1234568') || 
                                        t.symbol?.toLowerCase().includes('usdc')
                                      );

                                      toast({
                                        title: "Mirror Node Check",
                                        description: `Account found! ${tokenCount} tokens. USDC: ${hasUSDC ? 'Found' : 'Not found'}`,
                                      });

                                    } catch (error) {
                                      console.error('Mirror Node check error:', error);
                                      toast({
                                        title: "Check Failed",
                                        description: error instanceof Error ? error.message : "Mirror Node check failed",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                  🔍 Debug Mirror Node Direct
                                </Button>

                                {/* Check HBAR Balance (SDK Only) */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      const userAccountId = user?.accountId || user?.walletAddress;
                                      if (!userAccountId) {
                                        toast({
                                          title: "Error",
                                          description: "No user account found",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      console.log('💰 Checking HBAR balance via Hedera SDK only...');
                                      
                                      // Import SDK components
                                      const { AccountBalanceQuery, AccountId } = await import('@hashgraph/sdk');
                                      const { vaultService } = await import('../hooks/useVault');
                                      
                                      // Use the public method to get token balance instead of direct SDK access
                                      console.log('🔧 Getting HBAR balance via vault service...', {
                                        accountId: userAccountId
                                      });

                                      // Get HBAR balance using the vault service method
                                      const hbarBalance = await vaultService.getTokenBalance('HBAR', userAccountId);
                                      
                                      // Convert to HBAR units (8 decimals)
                                      const hbarBalanceUnits = hbarBalance / 100000000;
                                      
                                      console.log('💰 HBAR Balance Results:', {
                                        method: 'Vault Service',
                                        userAddress: userAccountId,
                                        hbarBalanceSmallest: hbarBalance,
                                        hbarBalanceUnits: hbarBalanceUnits
                                      });

                                      // Show result
                                      toast({
                                        title: "HBAR Balance (Vault Service) ✅",
                                        description: `${hbarBalanceUnits} HBAR`,
                                      });

                                    } catch (error) {
                                      console.error('❌ SDK HBAR balance check error:', error);
                                      
                                      let errorMessage = "SDK balance check failed";
                                      if (error.message?.includes('HashConnect not connected')) {
                                        errorMessage = "Please connect HashPack wallet first";
                                      } else if (error.message?.includes('network')) {
                                        errorMessage = "Network connection issue";
                                      } else if (error.message?.includes('127.0.0.1')) {
                                        errorMessage = "Hedera network node issue - try again later";
                                      }
                                      
                                      toast({
                                        title: "SDK Check Failed ❌",
                                        description: errorMessage,
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                                >
                                  🔧 Check HBAR (SDK Only)
                                </Button>

                                {/* Check USDC Balance (SDK Only) */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      const userAccountId = user?.accountId || user?.walletAddress;
                                      if (!userAccountId) {
                                        toast({
                                          title: "Error",
                                          description: "No user account found",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      console.log('💰 Checking USDC balance via vault service...');
                                      
                                      // Import vault service
                                      const { vaultService } = await import('../hooks/useVault');
                                      
                                      console.log('🔧 Getting USDC balance via vault service...', {
                                        accountId: userAccountId,
                                        tokenId: '0.0.456858'
                                      });

                                      // Get USDC balance using the vault service method
                                      const usdcBalance = await vaultService.getTokenBalance('0.0.456858', userAccountId);
                                      
                                      // Convert to USDC units (6 decimals)
                                      const usdcBalanceUnits = usdcBalance / 1000000;
                                      const isAssociated = usdcBalance > 0;
                                      
                                      // Get HBAR balance for comparison
                                      const hbarBalance = await vaultService.getTokenBalance('HBAR', userAccountId);
                                      const hbarBalanceUnits = hbarBalance / 100000000; // 8 decimals for HBAR
                                      
                                      console.log('💰 Vault Service Balance Results:', {
                                        method: 'Vault Service',
                                        usdcTokenId: '0.0.456858',
                                        userAddress: userAccountId,
                                        usdcAssociated: isAssociated,
                                        usdcBalanceSmallest: usdcBalance,
                                        usdcBalanceUnits: usdcBalanceUnits,
                                        hbarBalanceSmallest: hbarBalance,
                                        hbarBalanceUnits: hbarBalanceUnits
                                      });

                                      // Show result
                                      if (!isAssociated) {
                                        toast({
                                          title: "USDC Not Associated ❌",
                                          description: `USDC token not found. Please associate 0.0.456858`,
                                          variant: "destructive"
                                        });
                                      } else {
                                        toast({
                                          title: "USDC Balance (Vault Service) ✅",
                                          description: `USDC: ${usdcBalanceUnits} | HBAR: ${hbarBalanceUnits}`,
                                        });
                                      }

                                    } catch (error) {
                                      console.error('❌ SDK USDC balance check error:', error);
                                      
                                      let errorMessage = "SDK balance check failed";
                                      if (error.message?.includes('HashConnect not connected')) {
                                        errorMessage = "Please connect HashPack wallet first";
                                      } else if (error.message?.includes('network')) {
                                        errorMessage = "Network connection issue";
                                      }
                                      
                                      toast({
                                        title: "SDK Check Failed ❌",
                                        description: errorMessage,
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
                                >
                                  🔧 Check USDC (SDK Only)
                                </Button>

                                {/* Debug Token Balance */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      await loadUserData();
                                      console.log('🔍 Current token balance:', userTokenBalance);
                                      toast({
                                        title: "Balance Check",
                                        description: `Token balance: ${userTokenBalance} (check console for details)`,
                                      });
                                    } catch (error) {
                                      console.error('Balance check error:', error);
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                  📊 Check Balance (Hook)
                                </Button>

                                                                {/* Associate USDC Token via HashConnect */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      const userAccountId = user?.accountId || user?.walletAddress;
                                      if (!userAccountId) {
                                        toast({
                                          title: "Error",
                                          description: "No user account found",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      console.log('🔗 Attempting to associate USDC token via HashConnect...');
                                      const { vaultService } = await import('../hooks/useVault');
                                      
                                      toast({
                                        title: "Associating Token...",
                                        description: "Please confirm in HashPack wallet",
                                      });

                                      // Try to associate USDC token
                                      const result = await vaultService.associateToken('0.0.456858');
                                      
                                      console.log('🔗 Association result:', result);
                                      
                                      if (result.status === 'SUCCESS') {
                                        toast({
                                          title: "Association Success ✅",
                                          description: "USDC token has been associated to your account",
                                        });
                                      } else {
                                        toast({
                                          title: "Association Info ℹ️",
                                          description: result.note || "Please check the result",
                                        });
                                      }

                                    } catch (error) {
                                      console.error('Association error:', error);
                                      
                                      if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
                                        toast({
                                          title: "Already Associated ✅",
                                          description: "USDC token is already associated to your account",
                                        });
                                      } else {
                                        toast({
                                          title: "Association Failed",
                                          description: "Try manual association: HashPack → Assets → Add Token → 0.0.456858",
                                          variant: "destructive"
                                        });
                                      }
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                                >
                                  🔗 Associate USDC (Auto)
                                </Button>

                                {/* How to Get USDC */}
                                <Button
                                  onClick={() => {
                                    const usdcGuide = {
                                      tokenId: '0.0.456858',
                                      name: 'USD Coin',
                                      symbol: 'USDC',
                                      decimals: 6,
                                      type: 'HTS Token on Hedera',
                                      howToGet: [
                                        '1. SaucerSwap: Swap HBAR → USDC',
                                        '2. Helix: Another Hedera DEX',
                                        '3. Pangolin: Cross-chain bridge',
                                        '4. CEX: Buy USDC and withdraw to Hedera',
                                        '5. Testing: Use testnet faucets'
                                      ],
                                      links: {
                                        saucerswap: 'https://www.saucerswap.finance/',
                                        helix: 'https://helix.services/',
                                        pangolin: 'https://pangolin.exchange/'
                                      }
                                    };

                                    console.log('💰 How to Get USDC:', usdcGuide);
                                    
                                    toast({
                                      title: "How to Get USDC 💡",
                                      description: "1. Go to SaucerSwap.finance 2. Connect HashPack 3. Swap HBAR → USDC",
                                    });
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                  💡 How to Get USDC
                                </Button>

                                {/* Open SaucerSwap */}
                                <Button
                                  onClick={() => {
                                    console.log('🔄 Opening SaucerSwap for HBAR → USDC swap...');
                                    
                                    // Open SaucerSwap in new tab
                                    const saucerSwapUrl = 'https://www.saucerswap.finance/swap';
                                    window.open(saucerSwapUrl, '_blank');
                                    
                                    toast({
                                      title: "SaucerSwap Opened 🔄",
                                      description: "Connect HashPack and swap HBAR → USDC",
                                    });
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                  🔄 Open SaucerSwap
                                </Button>

                                {/* Check Vault Timestamps */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      console.log('⏰ Checking vault timestamps...');
                                      await loadVaultData();
                                      
                                      // Get current vault state
                                      const currentVaultState = vaultStates[selectedVault?.vaultAddress || ''];
                                      
                                      if (currentVaultState) {
                                        const currentTime = Math.floor(Date.now() / 1000);
                                        const runTime = new Date(currentVaultState.runTimestamp * 1000);
                                        const stopTime = new Date(currentVaultState.stopTimestamp * 1000);
                                        
                                        console.log('⏰ Vault Timestamps:', {
                                          currentTimestamp: currentTime,
                                          runTimestamp: currentVaultState.runTimestamp,
                                          stopTimestamp: currentVaultState.stopTimestamp,
                                          runTimeDate: runTime.toLocaleString(),
                                          stopTimeDate: stopTime.toLocaleString(),
                                          depositsClosedByTime: currentTime >= currentVaultState.runTimestamp,
                                          withdrawalsEnabledByTime: currentTime >= currentVaultState.stopTimestamp,
                                          depositsClosedActual: currentVaultState.depositsClosed,
                                          withdrawalsEnabledActual: currentVaultState.withdrawalsEnabled
                                        });
                                        
                                        toast({
                                          title: "Vault Timestamps ⏰",
                                          description: `Deposits close: ${runTime.toLocaleDateString()} | Withdrawals open: ${stopTime.toLocaleDateString()}`,
                                        });
                                      } else {
                                        toast({
                                          title: "No Vault Data",
                                          description: "Please select a vault first",
                                          variant: "destructive"
                                        });
                                      }
                                      
                                    } catch (error) {
                                      console.error('Timestamp check error:', error);
                                      toast({
                                        title: "Timestamp Check Failed",
                                        description: error instanceof Error ? error.message : "Failed to get timestamps",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                                >
                                  ⏰ Check Vault Timestamps
                                </Button>

                                {/* Check Token Balance via Contract */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      const userAccountId = user?.accountId || user?.walletAddress;
                                      if (!userAccountId) {
                                        toast({
                                          title: "Error",
                                          description: "No user account found",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      console.log('📖 Testing balanceOf contract function...');
                                      const { vaultService } = await import('../hooks/useVault');
                                      
                                      // Get token1Address from vault state
                                      const vaultState = vaultStates[selectedVault?.vaultAddress || ''];
                                      const token1Address = vaultState?.token1Address || selectedVault?.tokenAddress || '';
                                      
                                      console.log('📖 Using token1Address from vault state:', {
                                        vaultAddress: selectedVault?.vaultAddress,
                                        token1Address: token1Address,
                                        configTokenAddress: selectedVault?.tokenAddress
                                      });
                                      
                                      // Test the new balanceOf contract function with dynamic token1Address
                                      const contractBalance = await vaultService.getTokenBalanceContract(token1Address, userAccountId);
                                      const tokenDecimals = selectedVault?.token === 'HBAR' ? 8 : 6;
                                      const contractBalanceUnits = contractBalance / Math.pow(10, tokenDecimals);

                                      console.log('📖 Contract Balance Results:', {
                                        method: 'balanceOf contract call',
                                        balanceSmallest: contractBalance,
                                        balanceUnits: contractBalanceUnits,
                                        token: selectedVault?.token,
                                        userAddress: userAccountId,
                                        token1Address: token1Address
                                      });

                                      toast({
                                        title: "Contract Balance ✅",
                                        description: `${contractBalanceUnits} ${selectedVault?.token} (via balanceOf)`,
                                      });

                                    } catch (error) {
                                      console.error('Contract balance check error:', error);
                                      toast({
                                        title: "Contract Check Failed",
                                        description: error instanceof Error ? error.message : "balanceOf contract call failed",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-teal-500 text-teal-600 hover:bg-teal-50"
                                >
                                  📖 Check Balance (Contract)
                                </Button>

                                {/* Get Token Addresses from Vault */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      console.log('🔍 Getting token addresses from vault...');
                                      const { vaultService } = await import('../hooks/useVault');
                                      
                                      // Initialize vault contract first
                                      if (selectedVault?.vaultAddress) {
                                        await vaultService.initializeContracts(selectedVault.vaultAddress);
                                        
                                        // Get both token addresses
                                        const [token1Address, token2Address] = await Promise.all([
                                          vaultService.getToken1Address(),
                                          vaultService.getToken2Address()
                                        ]);

                                        console.log('📖 Token Addresses from Vault:', {
                                          vaultAddress: selectedVault.vaultAddress,
                                          token1Address: token1Address,
                                          token2Address: token2Address,
                                          currentConfigToken: selectedVault.tokenAddress
                                        });

                                        toast({
                                          title: "Token Addresses ✅",
                                          description: `Token1: ${token1Address.slice(0, 10)}... | Token2: ${token2Address.slice(0, 10)}...`,
                                        });
                                      } else {
                                        toast({
                                          title: "No Vault Selected",
                                          description: "Please select a vault first",
                                          variant: "destructive"
                                        });
                                      }

                                    } catch (error) {
                                      console.error('Token address check error:', error);
                                      toast({
                                        title: "Token Address Check Failed",
                                        description: error instanceof Error ? error.message : "Failed to get token addresses",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-cyan-500 text-cyan-600 hover:bg-cyan-50"
                                >
                                  🔍 Get Token Addresses
                                </Button>

                                {/* Associate Token Button */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      // Import vaultService to access associateToken
                                      const { vaultService } = await import('../hooks/useVault');
                                      await vaultService.associateToken(selectedVault.tokenAddress);
                                      toast({
                                        title: "Success",
                                        description: "Token associated successfully! Now check balance.",
                                      });
                                      // Refresh balance after association
                                      setTimeout(() => loadUserData(), 2000);
                                    } catch (error) {
                                      toast({
                                        title: "Associate Error",
                                        description: error instanceof Error ? error.message : "Failed to associate token",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                                >
                                  🔗 Associate Token (Disabled)
                                </Button>

                                {/* Approve Button for Real Vault */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      await approveToken(parseFloat(depositAmount));
                                      toast({
                                        title: "Success",
                                        description: "Token approval successful! You can now deposit.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: error instanceof Error ? error.message : "Failed to approve tokens",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  disabled={isLoading || !depositAmount}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                  🔐 Approve Token
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Withdraw */}
                    {selectedVault.withdrawalsEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-amount">Withdraw Shares</Label>
                        <div className="flex gap-2">
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="Enter shares"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            disabled={isLoading}
                          />
                          <Button 
                            onClick={handleWithdraw}
                            disabled={isLoading || !withdrawAmount}
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                          >
                            {isLoading ? 'Processing...' : 'Withdraw'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status Messages */}
                    <div className="space-y-2 text-sm">
                      {selectedVault.depositsClosed && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Lock className="h-4 w-4" />
                          <span>Deposits are closed</span>
                        </div>
                      )}
                      {!selectedVault.withdrawalsEnabled && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span>Withdrawals not yet enabled</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vault Stats */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vault Statistics</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-cyrus-card/60 rounded-lg">
                        <div className="text-sm text-cyrus-textSecondary">Total Value Locked</div>
                        <div className="text-xl font-bold">{vaultService.formatAmount(selectedVault.totalDeposits)}</div>
                      </div>
                      <div className="p-3 bg-cyrus-card/60 rounded-lg">
                        <div className="text-sm text-cyrus-textSecondary">Your Position</div>
                        <div className="text-xl font-bold text-green-500">{vaultService.formatAmount(userTotalDeposited)}</div>
                      </div>
                      <div className="p-3 bg-cyrus-card/60 rounded-lg">
                        <div className="text-sm text-cyrus-textSecondary">Shareholders</div>
                        <div className="text-xl font-bold">{selectedVault.shareholderCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-vaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Vault Positions</CardTitle>
              <CardDescription>Overview of your vault investments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vaults.filter(vault => userShares > 0).length > 0 ? (
                  vaults.map(vault => (
                    <div key={vault.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{vault.name}</h4>
                        <p className="text-sm text-cyrus-textSecondary">{vault.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{userShares} shares</div>
                        <div className="text-sm text-cyrus-textSecondary">
                          {vaultService.formatAmount(userShares * (vault.totalDeposits / vault.totalShares))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-cyrus-textSecondary">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No vault positions found</p>
                    <p className="text-sm">Start investing in vaults to see your positions here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Traders</CardTitle>
              <CardDescription>Leading investors in this vault</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Total Deposited</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTraders.map((trader, index) => (
                    <TableRow key={trader.address}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{vaultService.formatAddress(trader.address)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(trader.address)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{trader.shares.toLocaleString()}</TableCell>
                      <TableCell>{vaultService.formatAmount(trader.totalDeposited)}</TableCell>
                      <TableCell>{trader.transactionCount}</TableCell>
                      <TableCell>{vaultService.formatRelativeTime(trader.lastTransaction)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest 5 transactions in this vault</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionHistory.map((tx) => (
                    <TableRow key={tx.hash}>
                      <TableCell>
                        <Badge 
                          variant={tx.type === 'deposit' ? 'default' : 'secondary'}
                          className={tx.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'}
                        >
                          {tx.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{vaultService.formatAddress(tx.from)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tx.from)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{vaultService.formatAddress(tx.to)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tx.to)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{vaultService.formatAmount(parseFloat(tx.value))}</TableCell>
                      <TableCell>{vaultService.formatRelativeTime(tx.timestamp)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{vaultService.formatHash(tx.hash)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tx.hash)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug components removed for production */}
    </div>
  );
};

export default Vault;