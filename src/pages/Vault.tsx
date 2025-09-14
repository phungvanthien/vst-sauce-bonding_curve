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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useWallet } from "@/contexts/WalletContext";
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
  getVaultStatus,
  fetchDepositTransactions,
  DepositTransaction,
  getTokenLogoUrl,
} from "@/utils/vault-utils";
import { VAULTS_CONFIG } from "@/config/hederaConfig";
import {
  checkAndApproveTokens,
  getTokenDecimal,
  waitForEVMNativeBalance,
} from "@/utils/token-utils";

const Vault: React.FC = () => {
  const { user } = useAuth();
  const { walletInfo } = useWallet();
  const {
    vaults,
    selectedVault,
    setSelectedVault,
    userShares,
    userTotalDeposited,
    topTraders,
    loadVaultData,
    loadUserData,
    loadTopTraders,
    loadTransactionHistory,
    deposit,
    setHashConnectData,
    setEVMSigner,
    callGetVaultInfo,
  } = useVault();

  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [isLoadingTokenBalance, setIsLoadingTokenBalance] = useState(false);

  // Loading states moved from VaultContext
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVaultData, setIsLoadingVaultData] = useState(false);
  const [isLoadingTopTraders, setIsLoadingTopTraders] = useState(false);

  // Deposit transactions table state
  const [allDepositTransactions, setAllDepositTransactions] = useState<
    DepositTransaction[]
  >([]);
  const [depositTransactions, setDepositTransactions] = useState<
    DepositTransaction[]
  >([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoadingDepositTransactions, setIsLoadingDepositTransactions] =
    useState(false);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] =
    useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Pagination state for loaded transactions
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Load top traders with loading state
  const loadTopTradersWithLoading = useCallback(async () => {
    if (!selectedVault || selectedVault.name === "Coming Soon...") {
      return;
    }

    setIsLoadingTopTraders(true);
    try {
      await loadTopTraders();
    } catch (error) {
      console.error("Error loading top traders:", error);
      toast({
        title: "Error",
        description: "Failed to load top traders",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTopTraders(false);
    }
  }, [selectedVault, loadTopTraders]);

  // Load deposit transactions for the selected vault
  const loadDepositTransactions = useCallback(async () => {
    if (!selectedVault || selectedVault.name === "Coming Soon...") {
      setAllDepositTransactions([]);
      setDepositTransactions([]);
      setTotalTransactions(0);
      setCurrentOffset(0);
      setHasMoreTransactions(true);
      setCurrentPage(1);
      return;
    }

    setIsLoadingDepositTransactions(true);
    try {
      // Fetch first 1000 deposit transactions from API
      const response = await fetchDepositTransactions(
        selectedVault.id,
        0, // offset - start from beginning
        1000 // limit - fetch first 1000 transactions
      );

      setAllDepositTransactions(response.transactions);
      setTotalTransactions(response.total);
      setCurrentOffset(1000); // Set offset for next load
      setHasMoreTransactions(response.transactions.length === 1000); // If we got exactly 1000, there might be more
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error("Error loading deposit transactions:", error);
      setAllDepositTransactions([]);
      setDepositTransactions([]);
      setTotalTransactions(0);
      setCurrentOffset(0);
      setHasMoreTransactions(false);

      // Show error toast to user
      toast({
        title: "Error",
        description: "Failed to load deposit transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDepositTransactions(false);
    }
  }, [selectedVault]);

  // Load more deposit transactions
  const loadMoreDepositTransactions = useCallback(async () => {
    if (
      !selectedVault ||
      selectedVault.name === "Coming Soon..." ||
      !hasMoreTransactions
    ) {
      return;
    }

    setIsLoadingMoreTransactions(true);
    try {
      // Fetch next 1000 deposit transactions from API
      const response = await fetchDepositTransactions(
        selectedVault.id,
        currentOffset, // offset - continue from where we left off
        1000 // limit - fetch next 1000 transactions
      );

      // Append new transactions to existing ones
      setAllDepositTransactions((prev) => [...prev, ...response.transactions]);
      setCurrentOffset((prev) => prev + 1000); // Update offset for next load
      setHasMoreTransactions(response.transactions.length === 1000); // If we got exactly 1000, there might be more
    } catch (error) {
      console.error("Error loading more deposit transactions:", error);

      // Show error toast to user
      toast({
        title: "Error",
        description: "Failed to load more transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMoreTransactions(false);
    }
  }, [selectedVault, currentOffset, hasMoreTransactions]);

  // Handle pagination for loaded transactions
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTransactions = allDepositTransactions.slice(
      startIndex,
      endIndex
    );
    setDepositTransactions(paginatedTransactions);
  }, [allDepositTransactions, currentPage, pageSize]);

  // Load token balance from account
  const loadUserTokenBalance = useCallback(async () => {
    if (!user) return;

    setIsLoadingTokenBalance(true);
    try {
      const userAddress = getUserAddress(user);
      if (!userAddress) {
        return;
      }

      // Get token address from selected vault or first available vault
      let tokenAddress = "";
      if (selectedVault && selectedVault.tokenAddress) {
        tokenAddress = selectedVault.tokenAddress;
      } else if (vaults.length > 0 && vaults[0].tokenAddress) {
        tokenAddress = vaults[0].tokenAddress;
      } else {
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

      // Convert from smallest units to human readable using dynamic decimals
      const balanceInUnits = Number(balance) / Math.pow(10, tokenDecimals);

      setUserTokenBalance(balanceInUnits);
    } catch (error) {
      console.error("Error loading token balance:", error);
      setUserTokenBalance(0);
    } finally {
      setIsLoadingTokenBalance(false);
    }
  }, [user, selectedVault, vaults]);

  // Set wallet signer based on wallet type
  useEffect(() => {
    if (walletInfo?.isConnected) {
      if (
        walletInfo.type === "hashpack" &&
        walletInfo.manager &&
        walletInfo.pairingData
      ) {
        // Set HashPack signer
        setHashConnectData(walletInfo.manager, walletInfo.pairingData);
      } else if (walletInfo.type === "evm" && walletInfo.evmSigner) {
        // Set EVM signer
        setEVMSigner(walletInfo.evmSigner);
      }
    }
  }, [walletInfo, setHashConnectData, setEVMSigner]);

  // Load data when user changes
  useEffect(() => {
    if (user && vaults.length > 0) {
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
      const userAddress = getUserAddress(user);
      if (userAddress) {
        loadUserData(userAddress);
        loadTopTradersWithLoading(); // Use the loading version
        loadTransactionHistory(userAddress);
        loadUserTokenBalance(); // Reload balance when vault changes
        loadDepositTransactions(); // Load deposit transactions

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
    loadTopTradersWithLoading,
    loadTransactionHistory,
    callGetVaultInfo,
    loadUserTokenBalance,
    loadDepositTransactions,
  ]);

  // Load top traders when vaults are available but topTraders is empty
  useEffect(() => {
    if (
      selectedVault &&
      selectedVault.name !== "Coming Soon..." &&
      topTraders.length === 0 &&
      !isLoadingTopTraders
    ) {
      // Small delay to ensure vault data is loaded
      const timer = setTimeout(() => {
        loadTopTradersWithLoading();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    selectedVault,
    topTraders.length,
    isLoadingTopTraders,
    loadTopTradersWithLoading,
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

      // Get token decimals for approval
      const tokenDecimals = await getTokenDecimal(
        selectedVault.tokenAddress as `0x${string}`
      );

      // Check and approve tokens for the vault
      const approvalResult = await checkAndApproveTokens(
        walletInfo?.manager,
        walletInfo?.pairingData,
        selectedVault.tokenAddress,
        userEvmAddress,
        selectedVault.vaultAddress,
        depositAmount,
        tokenDecimals,
        walletInfo?.type || "hashpack"
      );

      if (!approvalResult.success) {
        throw new Error(`Token approval failed: ${approvalResult.error}`);
      }

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

      // For EVM wallets, wait for native balance to be available after approval
      if (walletInfo?.type === "evm") {
        toast({
          title: "Checking Balance",
          description: "Waiting for native token balance to update...",
        });

        const balanceAvailable = await waitForEVMNativeBalance(userEvmAddress);

        if (!balanceAvailable) {
          toast({
            title: "Balance Check Failed",
            description:
              "Please check your HBAR balance and click deposit again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Balance Ready",
          description:
            "Native token balance is now available. Proceeding with deposit...",
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
              {walletInfo?.type === "hashpack"
                ? "HashPack Connected"
                : walletInfo?.type === "evm"
                ? "EVM Wallet Connected"
                : "No Wallet Connected"}
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
          <TabsTrigger value="vaults">Vault Details</TabsTrigger>
          <TabsTrigger value="my-vaults">My Vaults</TabsTrigger>
          <TabsTrigger value="traders">Top Holders</TabsTrigger>
          <TabsTrigger value="transactions">Deposit Transactions</TabsTrigger>
        </TabsList>

        {/* Vault List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Vaults */}
          {vaults.map((vault) => {
            const vaultStatus = getVaultStatus(vault);

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
                        vaultStatus.status === "active"
                          ? "default"
                          : "secondary"
                      }
                      className={vaultStatus.className}
                    >
                      {vaultStatus.label}
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatVaultAmount(vault.totalDeposits, vault.token)}
                      </span>
                      <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                        <img
                          src={getTokenLogoUrl(vault.token)}
                          alt={vault.token}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to letter if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback =
                              target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div
                          className="w-4 h-4 bg-cyrus-accent rounded-full flex items-center justify-center"
                          style={{ display: "none" }}
                        >
                          <span className="text-xs font-bold text-white">
                            {vault.token.charAt(0)}
                          </span>
                        </div>
                      </div>
                    </div>
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
                      <span>Deposit Close:</span>
                      <span>{formatTimestamp(vault.runTimestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vault Close:</span>
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
                  <span>Vault Close:</span>
                  <span className="text-gray-400">TBD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="vaults" className="space-y-6">
          {/* Selected Vault Details */}
          {selectedVault ? (
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
                            {formatVaultAmount(
                              selectedVault.totalDeposits,
                              selectedVault.token
                            )}
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
                            {formatVaultAmount(
                              userTotalDeposited,
                              selectedVault.token
                            )}
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
                      {getVaultStatus(selectedVault).status === "active" && (
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
                            {formatVaultAmount(
                              selectedVault.totalDeposits,
                              selectedVault.token
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-cyrus-card/60 rounded-lg">
                          <div className="text-sm text-cyrus-textSecondary">
                            Your Position
                          </div>
                          <div className="text-xl font-bold text-green-500">
                            {formatVaultAmount(
                              userTotalDeposited,
                              selectedVault.token
                            )}
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
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    No Vault Selected
                  </h4>
                  <p className="text-sm text-gray-500">
                    Please select a vault from the list above to view details.
                  </p>
                </div>
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
                {selectedVault && selectedVault.name !== "Coming Soon..." && ""}
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
                    <p>No position found</p>
                    <p className="text-sm">
                      Start investing in this vault to see your positions
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traders" className="space-y-6">
          {selectedVault && selectedVault.name !== "Coming Soon..." ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Holders</CardTitle>
                    <CardDescription>
                      Top 10 holders by amount deposited in this vault
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadTopTradersWithLoading}
                    disabled={isLoadingTopTraders}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isLoadingTopTraders ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Total Deposited</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTopTraders ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyrus-accent"></div>
                            <p className="text-cyrus-textSecondary">
                              Loading top holders...
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : topTraders.length > 0 ? (
                      topTraders.slice(0, 10).map((holder, index) => (
                        <TableRow key={holder.address}>
                          <TableCell className="font-medium">
                            #{index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {formatUserAddress(holder.address)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(holder.address)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {holder.shares.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {formatVaultAmount(
                              holder.totalDeposited,
                              selectedVault.token
                            )}
                          </TableCell>
                          <TableCell>
                            {selectedVault.totalDeposits > 0
                              ? (
                                  (holder.totalDeposited /
                                    selectedVault.totalDeposits) *
                                  100
                                ).toFixed(2) + "%"
                              : "0.00%"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-cyrus-textSecondary opacity-50" />
                            <p className="text-cyrus-textSecondary">
                              No holders found
                            </p>
                            <p className="text-sm text-cyrus-textSecondary">
                              Holders will appear here once users start
                              depositing
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    No Vault Selected
                  </h4>
                  <p className="text-sm text-gray-500">
                    Please select a vault to view top holders.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Deposit Transactions Table */}
          {selectedVault && selectedVault.name !== "Coming Soon..." ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Deposit Transactions
                    </CardTitle>
                    <CardDescription>
                      Recent deposit transactions for this vault
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDepositTransactions}
                    disabled={isLoadingDepositTransactions}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isLoadingDepositTransactions ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Page Size Selector and Transaction Count Display */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cyrus-textSecondary">
                      Show:
                    </span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1); // Reset to first page when changing page size
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-cyrus-textSecondary">
                      entries
                    </span>
                  </div>
                  <div className="text-sm text-cyrus-textSecondary">
                    Showing {depositTransactions.length} of{" "}
                    {allDepositTransactions.length} loaded transactions
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Shareholder</TableHead>
                        <TableHead>Transaction Hash</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Token</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingDepositTransactions ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyrus-accent"></div>
                              <p className="text-cyrus-textSecondary">
                                Loading deposit transactions...
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : depositTransactions.length > 0 ? (
                        depositTransactions.map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-cyrus-textSecondary" />
                                <span className="text-sm">
                                  {new Date(
                                    transaction.timestamp * 1000
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">
                                  {formatUserAddress(transaction.user_address)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(transaction.user_address)
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">
                                  {formatHash(transaction.hash)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(transaction.hash)
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `https://hashscan.io/mainnet/transaction/${transaction.hash}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {transaction.amount.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                                  <img
                                    src={getTokenLogoUrl(selectedVault.token)}
                                    alt={selectedVault.token}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // Fallback to letter if image fails to load
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const fallback =
                                        target.nextElementSibling as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }}
                                  />
                                  <div
                                    className="w-6 h-6 bg-cyrus-accent rounded-full flex items-center justify-center"
                                    style={{ display: "none" }}
                                  >
                                    <span className="text-xs font-bold text-white">
                                      {selectedVault.token.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-medium">
                                  {selectedVault.token}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <TrendingUp className="h-8 w-8 text-cyrus-textSecondary opacity-50" />
                              <p className="text-cyrus-textSecondary">
                                No deposit transactions found
                              </p>
                              <p className="text-sm text-cyrus-textSecondary">
                                Deposit transactions will appear here once users
                                start depositing
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination for loaded transactions */}
                {allDepositTransactions.length > pageSize && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-cyrus-textSecondary">
                      Page {currentPage} of{" "}
                      {Math.ceil(allDepositTransactions.length / pageSize)}
                    </div>
                    <Pagination>
                      <PaginationContent>
                        {/* First Page Button */}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(1)}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          >
                            First
                          </PaginationLink>
                        </PaginationItem>

                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {/* Page Numbers */}
                        {(() => {
                          const totalPages = Math.ceil(
                            allDepositTransactions.length / pageSize
                          );
                          const pages = [];

                          // Calculate the 5 page numbers to show
                          let startPage, endPage;

                          if (currentPage <= 3) {
                            // At page 1, 2, or 3 - show pages 1-5 (or up to totalPages)
                            startPage = 1;
                            endPage = Math.min(5, totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            // At last 3 pages - show last 5 pages (or from 1)
                            startPage = Math.max(1, totalPages - 4);
                            endPage = totalPages;
                          } else {
                            // In the middle - show 2 before, current, 2 after
                            startPage = currentPage - 2;
                            endPage = currentPage + 2;
                          }

                          // Generate page numbers
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(i)}
                                  isActive={currentPage === i}
                                  className="cursor-pointer border-white"
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }

                          return pages;
                        })()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage(
                                Math.min(
                                  Math.ceil(
                                    allDepositTransactions.length / pageSize
                                  ),
                                  currentPage + 1
                                )
                              )
                            }
                            className={
                              currentPage ===
                              Math.ceil(
                                allDepositTransactions.length / pageSize
                              )
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {/* Last Page Button */}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() =>
                              setCurrentPage(
                                Math.ceil(
                                  allDepositTransactions.length / pageSize
                                )
                              )
                            }
                            className={
                              currentPage ===
                              Math.ceil(
                                allDepositTransactions.length / pageSize
                              )
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          >
                            Last
                          </PaginationLink>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* Load More Button */}
                {hasMoreTransactions && allDepositTransactions.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={loadMoreDepositTransactions}
                      disabled={isLoadingMoreTransactions}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {isLoadingMoreTransactions ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyrus-accent"></div>
                          Loading More...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Load More Transactions (1000 more)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* End of data message */}
                {!hasMoreTransactions && allDepositTransactions.length > 0 && (
                  <div className="text-center mt-6">
                    <p className="text-sm text-cyrus-textSecondary">
                      All transactions loaded ({allDepositTransactions.length}{" "}
                      total)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    No Vault Selected
                  </h4>
                  <p className="text-sm text-gray-500">
                    Please select a vault to view deposit transactions.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Vault;
