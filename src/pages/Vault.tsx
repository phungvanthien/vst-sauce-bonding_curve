import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  Shield,
  RefreshCw,
  ExternalLink,
  Copy,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHashConnect } from "@/contexts/HashConnectContext";
import { useVault } from "@/contexts/VaultContext";
import { toast } from "@/hooks/use-toast";
import {
  getUserAddress,
  formatUserAddress,
  getAccountBalance,
  accountIdToEvmAddress,
} from "@/utils/account-utils";
import {
  formatVaultAmount,
  formatTimestamp,
  formatHash,
  getTimeRemaining,
  formatRelativeTime,
} from "@/utils/vault-utils";
import { VAULTS_CONFIG } from "@/config/hederaConfig";
import { checkAndApproveTokens, getTokenDecimal } from "@/utils/token-utils";

const Vault: React.FC = () => {
  const { user } = useAuth();
  const {
    vaults,
    selectedVault,
    setSelectedVault,
    userShares,
    userTotalDeposited,
    topTraders,
    transactionHistory,
    loadVaultData,
    loadUserData,
    loadTopTraders,
    loadTransactionHistory,
    deposit,
    checkWithdrawStatus,
    setHashConnectData,
    callGetVaultInfo,
  } = useVault();
  const { manager, pairingData } = useHashConnect();

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [isLoadingTokenBalance, setIsLoadingTokenBalance] = useState(false);

  // Loading states moved from VaultContext
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoadingVaultData, setIsLoadingVaultData] = useState(false);

  // Load token balance from account
  const loadUserTokenBalance = useCallback(async () => {
    if (!user) return;

    setIsLoadingTokenBalance(true);
    try {
      const userAddress = getUserAddress(user);
      if (!userAddress) {
        console.log("No user address available for token balance");
        return;
      }

      console.log("Loading token balance for user:", userAddress);

      // Get token address from selected vault or first available vault
      let tokenAddress = "";
      if (selectedVault && selectedVault.tokenAddress) {
        tokenAddress = selectedVault.tokenAddress;
      } else if (vaults.length > 0 && vaults[0].tokenAddress) {
        tokenAddress = vaults[0].tokenAddress;
      } else {
        console.log("No token address available for balance check");
        return;
      }

      // Fetch token balance using getAccountBalance
      const balance = await getAccountBalance(
        userAddress as `0.0.${string}`,
        tokenAddress as `0.0.${string}`
      );

      // Get token decimals dynamically
      const tokenDecimals = await getTokenDecimal(
        tokenAddress as `0x${string}`
      );
      console.log(`Token decimals for ${tokenAddress}: ${tokenDecimals}`);

      // Convert from smallest units to human readable using dynamic decimals
      const balanceInUnits = Number(balance) / Math.pow(10, tokenDecimals);

      setUserTokenBalance(balanceInUnits);
      console.log("Token balance loaded:", balanceInUnits);
    } catch (error) {
      console.error("Error loading token balance:", error);
      setUserTokenBalance(0);
    } finally {
      setIsLoadingTokenBalance(false);
    }
  }, [user, selectedVault, vaults]);

  // Set HashConnect data when available
  useEffect(() => {
    if (manager && pairingData) {
      console.log("🔗 Setting HashConnect data for vault service");
      setHashConnectData(manager, pairingData);
    }
  }, [manager, pairingData, setHashConnectData]);

  // Load data when user changes
  useEffect(() => {
    if (user && vaults.length > 0) {
      console.log("🔄 Initial vault data load");
      const loadData = async () => {
        setIsLoadingVaultData(true);
        try {
          const userAddress = getUserAddress(user);
          if (userAddress) {
            await loadVaultData(userAddress);
          }
          await loadUserTokenBalance();
        } finally {
          setIsLoadingVaultData(false);
        }
      };
      loadData();
    }
  }, [user, vaults.length, loadVaultData, loadUserTokenBalance]);

  // Load user data when selected vault changes
  useEffect(() => {
    if (selectedVault && user) {
      console.log(
        "🔄 Loading user data for selected vault:",
        selectedVault.name
      );
      const userAddress = getUserAddress(user);
      if (userAddress) {
        loadUserData(userAddress);
        loadTopTraders();
        loadTransactionHistory(userAddress);
        checkWithdrawStatus();
        loadUserTokenBalance(); // Reload balance when vault changes

        // Also call getVaultInfo when vault is selected
        if (selectedVault.name !== "Coming Soon...") {
          callGetVaultInfo(selectedVault.vaultAddress);
        }
      }
    }
  }, [
    selectedVault,
    user,
    loadUserData,
    loadTopTraders,
    loadTransactionHistory,
    checkWithdrawStatus,
    callGetVaultInfo,
    loadUserTokenBalance,
  ]);

  // Xử lý deposit - tự động approve token
  const handleDeposit = async () => {
    if (!depositAmount) {
      toast({
        title: "Error",
        description: "Please enter deposit amount",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVault) {
      toast({
        title: "Error",
        description: "No vault selected",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userAddress = getUserAddress(user);
      if (!userAddress) {
        throw new Error("No user address available");
      }

      // Convert user address to EVM address for token approval
      const userEvmAddress = await accountIdToEvmAddress(userAddress);

      console.log("🔐 Checking and approving tokens before deposit...");
      console.log("User EVM address:", userEvmAddress);
      console.log("Vault address:", selectedVault.vaultAddress);
      console.log("Token address:", selectedVault.tokenAddress);

      // Get token decimals for approval
      const tokenDecimals = await getTokenDecimal(
        selectedVault.tokenAddress as `0x${string}`
      );

      // Check and approve tokens for the vault
      const approvalResult = await checkAndApproveTokens(
        manager,
        pairingData,
        selectedVault.tokenAddress,
        userEvmAddress,
        selectedVault.vaultAddress,
        depositAmount,
        tokenDecimals
      );

      if (!approvalResult.success) {
        throw new Error(`Token approval failed: ${approvalResult.error}`);
      }

      console.log(
        "✅ Token approval successful:",
        approvalResult.transactionHash
      );

      // Show approval success toast
      if (
        approvalResult.data?.message !== "Sufficient allowance already exists"
      ) {
        toast({
          title: "Token Approved",
          description:
            "Tokens approved successfully. Proceeding with deposit...",
        });
      }

      // Gọi deposit function
      await deposit(parseFloat(depositAmount), userAddress);

      setDepositAmount("");
      setShowDepositForm(false);

      toast({
        title: "Success",
        description: "Deposit completed successfully!",
      });
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to deposit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý withdraw - chỉ hiển thị popup, không thực hiện transaction
  const handleWithdraw = async () => {
    console.log("🔍 handleWithdraw called - starting local withdraw logic");

    if (!withdrawAmount) {
      toast({
        title: "Error",
        description: "Please enter withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      // Hiển thị popup "withdraw processing" ngay khi bấm
      toast({
        title: "Withdraw Processing",
        description: "Please wait while we process your withdrawal request...",
      });

      // Simulate processing delay
      console.log("🔍 Starting 3 second delay simulation");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Reset form (không hiển thị thông báo thành công)
      setWithdrawAmount("");
      console.log("🔍 handleWithdraw completed");
    } finally {
      setIsWithdrawing(false);
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
          <h1 className="text-3xl font-bold text-cyrus-text">
            Vault Management
          </h1>
          <p className="text-cyrus-textSecondary mt-2">
            Manage your investments across different vault strategies
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-cyrus-accent" />
            <span className="text-sm text-cyrus-textSecondary">
              HashPack Connected
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const userAddress = getUserAddress(user);
              if (userAddress) {
                loadVaultData(userAddress);
              }
            }}
            disabled={isLoadingVaultData}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingVaultData ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedVault && selectedVault.name !== "Coming Soon...") {
                callGetVaultInfo(selectedVault.vaultAddress);
              }
            }}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Get Vault Info
          </Button>
        </div>
      </div>

      {/* User Balance */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  Your {selectedVault?.token || vaults[0]?.token || "USDC"}{" "}
                  Balance
                </h3>
                <p className="text-sm text-cyrus-textSecondary">
                  Available for vault deposits
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {isLoadingTokenBalance ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyrus-accent"></div>
                      Loading...
                    </div>
                  ) : (
                    userTokenBalance.toFixed(2)
                  )}{" "}
                  {selectedVault?.token || vaults[0]?.token || "USDC"}
                </div>
                {/* <div className="text-sm text-cyrus-textSecondary">USDC</div> */}
                {!isLoadingTokenBalance && (
                  <div className="text-xs text-gray-500 mt-1">
                    Raw: {userTokenBalance}
                  </div>
                )}
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
            {/* Vaults */}
            {vaults.map((vault) => {
              const runTimeRemaining = getTimeRemaining(vault.runTimestamp);
              const stopTimeRemaining = getTimeRemaining(vault.stopTimestamp);

              return (
                <Card
                  key={vault.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedVault?.id === vault.id
                      ? "ring-2 ring-cyrus-accent"
                      : ""
                  }`}
                  onClick={() => setSelectedVault(vault)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vault.name}</CardTitle>
                      <Badge
                        variant={
                          vault.status === "active" ? "default" : "secondary"
                        }
                        className={
                          vault.depositsClosed
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }
                      >
                        {vault.depositsClosed ? "Deposits Closed" : "Active"}
                      </Badge>
                    </div>
                    <CardDescription>{vault.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* APY và Risk */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                          {vault.apy}% APY
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          vault.riskLevel === "Low"
                            ? "border-green-500 text-green-500"
                            : vault.riskLevel === "Medium"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-red-500 text-red-500"
                        }
                      >
                        {vault.riskLevel} Risk
                      </Badge>
                    </div>

                    {/* Total Deposits */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cyrus-textSecondary">
                        Total Deposits
                      </span>
                      <span className="font-medium">
                        {formatVaultAmount(vault.totalDeposits)}
                      </span>
                    </div>

                    {/* Shareholders */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cyrus-textSecondary">
                        Shareholders
                      </span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">
                          {vault.shareholderCount}/{vault.maxShareholders}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <Progress
                      value={
                        (vault.shareholderCount / vault.maxShareholders) * 100
                      }
                      className="h-2"
                    />

                    {/* Timestamps */}
                    <div className="space-y-2 text-xs text-cyrus-textSecondary">
                      <div className="flex items-center justify-between">
                        <span>Deposits Close:</span>
                        <span>{formatTimestamp(vault.runTimestamp)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Withdrawals Open:</span>
                        <span>{formatTimestamp(vault.stopTimestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Coming Soon Vault */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedVault?.name === "Coming Soon..."
                  ? "ring-2 ring-cyrus-accent"
                  : ""
              }`}
              onClick={() =>
                setSelectedVault({
                  id: 999,
                  name: "Coming Soon...",
                  description: "New vault strategies are being developed",
                  token: "TBD",
                  tokenAddress: "",
                  vaultAddress: "",
                  totalDeposits: 0,
                  totalShares: 0,
                  shareholderCount: 0,
                  maxShareholders: 50,
                  runTimestamp: 0,
                  stopTimestamp: 0,
                  depositsClosed: true,
                  withdrawalsEnabled: false,
                  apy: 0,
                  riskLevel: "TBD",
                  status: "coming_soon",
                })
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Coming Soon...</CardTitle>
                  <Badge variant="secondary" className="bg-gray-500">
                    Coming Soon
                  </Badge>
                </div>
                <CardDescription>
                  New vault strategies are being developed
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* APY và Risk */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-400">
                      TBD% APY
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-gray-400 text-gray-400"
                  >
                    TBD Risk
                  </Badge>
                </div>

                {/* Total Deposits */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cyrus-textSecondary">
                    Total Deposits
                  </span>
                  <span className="font-medium text-gray-400">$0.00</span>
                </div>

                {/* Shareholders */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cyrus-textSecondary">
                    Shareholders
                  </span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-400">0/50</span>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress value={0} className="h-2 bg-gray-200" />

                {/* Timestamps */}
                <div className="space-y-2 text-xs text-cyrus-textSecondary">
                  <div className="flex items-center justify-between">
                    <span>Deposits Close:</span>
                    <span className="text-gray-400">TBD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Withdrawals Open:</span>
                    <span className="text-gray-400">TBD</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Vault Details */}
          {selectedVault && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {selectedVault.name}
                  {selectedVault.name === "Coming Soon..." ? "" : " - Details"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedVault.name === "Coming Soon..." ? (
                  // Coming Soon Vault Details - Same format as real vault
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Vault Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Vault Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Token:
                          </span>
                          <span className="font-medium text-gray-400">TBD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Total Deposits:
                          </span>
                          <span className="font-medium text-gray-400">
                            $0.00
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Total Shares:
                          </span>
                          <span className="font-medium text-gray-400">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Your Shares:
                          </span>
                          <span className="font-medium text-gray-400">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Your Total Deposited:
                          </span>
                          <span className="font-medium text-gray-400">
                            $0.00
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">APY:</span>
                          <span className="font-medium text-gray-400">
                            TBD%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Quick Actions</h3>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-600 mb-2">
                            Coming Soon
                          </h4>
                          <p className="text-sm text-gray-500 mb-4">
                            This vault strategy is currently under development.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vault Stats */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Vault Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-cyrus-card/60 rounded-lg">
                          <div className="text-sm text-cyrus-textSecondary">
                            Total Value Locked
                          </div>
                          <div className="text-xl font-bold text-gray-400">
                            $0.00
                          </div>
                        </div>
                        <div className="p-3 bg-cyrus-card/60 rounded-lg">
                          <div className="text-sm text-cyrus-textSecondary">
                            Your Position
                          </div>
                          <div className="text-xl font-bold text-gray-400">
                            $0.00
                          </div>
                        </div>
                        <div className="p-3 bg-cyrus-card/60 rounded-lg">
                          <div className="text-sm text-cyrus-textSecondary">
                            Shareholders
                          </div>
                          <div className="text-xl font-bold text-gray-400">
                            0
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Real Vault Details
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Vault Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Vault Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Token:
                          </span>
                          <span className="font-medium">
                            {selectedVault.token}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Total Deposits:
                          </span>
                          <span className="font-medium">
                            {formatVaultAmount(selectedVault.totalDeposits)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Total Shares:
                          </span>
                          <span className="font-medium">
                            {selectedVault.totalShares.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Your Shares:
                          </span>
                          <span className="font-medium">
                            {userShares.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">
                            Your Total Deposited:
                          </span>
                          <span className="font-medium text-green-500">
                            {formatVaultAmount(userTotalDeposited)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyrus-textSecondary">APY:</span>
                          <span className="font-medium text-green-500">
                            {selectedVault.apy}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
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
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                              disabled={isLoading}
                            >
                              <ArrowUpRight className="h-4 w-4 mr-2" />
                              {selectedVault.id === 4
                                ? "Deposit to Real Vault"
                                : "Deposit to Vault"}
                            </Button>
                          ) : (
                            <div className="space-y-3 p-4 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="deposit-amount">
                                  Amount ({selectedVault.token})
                                </Label>
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
                                onChange={(e) =>
                                  setDepositAmount(e.target.value)
                                }
                                disabled={isLoading}
                                min="0.000001"
                                max="1000000"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleDeposit}
                                  disabled={isLoading || !depositAmount}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  {isLoading ? "Processing..." : "Deposit"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowDepositForm(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Withdraw Button */}
                      {selectedVault.withdrawalsEnabled && (
                        <div className="space-y-2">
                          <Label htmlFor="withdraw-amount">
                            Withdraw ({selectedVault.token})
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="withdraw-amount"
                              type="number"
                              placeholder={`Enter ${selectedVault.token} amount`}
                              value={withdrawAmount}
                              onChange={(e) =>
                                setWithdrawAmount(e.target.value)
                              }
                              disabled={isWithdrawing}
                            />
                            <Button
                              onClick={handleWithdraw}
                              disabled={isWithdrawing || !withdrawAmount}
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-50"
                            >
                              {isWithdrawing ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                  Processing...
                                </div>
                              ) : (
                                "Withdraw"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vault Stats */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Vault Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-cyrus-card/60 rounded-lg">
                          <div className="text-sm text-cyrus-textSecondary">
                            Total Value Locked
                          </div>
                          <div className="text-xl font-bold">
                            {formatVaultAmount(selectedVault.totalDeposits)}
                          </div>
                        </div>
                        <div className="p-3 bg-cyrus-card/60 rounded-lg">
                          <div className="text-sm text-cyrus-textSecondary">
                            Your Position
                          </div>
                          <div className="text-xl font-bold text-green-500">
                            {formatVaultAmount(userTotalDeposited)}
                          </div>
                        </div>
                        <div className="p-3 bg-cyrus-card/60 rounded-lg">
                          <div className="text-sm text-cyrus-textSecondary">
                            Shareholders
                          </div>
                          <div className="text-xl font-bold">
                            {selectedVault.shareholderCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-vaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Vault Positions</CardTitle>
              <CardDescription>
                Overview of your vault investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vaults.filter((vault) => userShares > 0).length > 0 ? (
                  vaults.map((vault) => (
                    <div
                      key={vault.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{vault.name}</h4>
                        <p className="text-sm text-cyrus-textSecondary">
                          {vault.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{userShares} shares</div>
                        <div className="text-sm text-cyrus-textSecondary">
                          {formatVaultAmount(
                            userShares *
                              (vault.totalDeposits / vault.totalShares)
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-cyrus-textSecondary">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No vault positions found</p>
                    <p className="text-sm">
                      Start investing in vaults to see your positions here
                    </p>
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
                      <TableCell className="font-medium">
                        #{index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatUserAddress(trader.address)}
                          </span>
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
                      <TableCell>
                        {formatVaultAmount(trader.totalDeposited)}
                      </TableCell>
                      <TableCell>{trader.transactionCount}</TableCell>
                      <TableCell>
                        {formatRelativeTime(trader.lastTransaction)}
                      </TableCell>
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
              <CardDescription>
                Latest 5 transactions in this vault
              </CardDescription>
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
                          variant={
                            tx.type === "deposit" ? "default" : "secondary"
                          }
                          className={
                            tx.type === "deposit"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {tx.type === "deposit" ? "Deposit" : "Withdraw"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatUserAddress(tx.from)}
                          </span>
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
                          <span className="font-mono text-sm">
                            {formatUserAddress(tx.to)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tx.to)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatVaultAmount(parseFloat(tx.value))}
                      </TableCell>
                      <TableCell>{formatRelativeTime(tx.timestamp)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatHash(tx.hash)}
                          </span>
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
                            onClick={() =>
                              window.open(
                                `https://etherscan.io/tx/${tx.hash}`,
                                "_blank"
                              )
                            }
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
    </div>
  );
};

export default Vault;
