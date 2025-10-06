import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useVault } from "@/hooks/useVault";
import { getUserAddress } from "@/utils/account-utils";
import { toast } from "@/hooks/use-toast";

// Import components
import VaultHeader from "@/components/vault/VaultHeader";
import UserBalanceCard from "@/components/vault/UserBalanceCard";
import VaultGrid from "@/components/vault/VaultGrid";
import VaultDetailsTab from "@/components/vault/VaultDetailsTab";
import MyVaultsTab from "@/components/vault/MyVaultsTab";
import TopHoldersTab from "@/components/vault/TopHoldersTab";
import TransactionsTab from "@/components/vault/TransactionsTab";

// Import hooks
import { useUserBalance } from "@/hooks/useUserBalance";
import { useSubscription } from "@/hooks/useSubscription";
import { useDepositTransactions } from "@/hooks/useDepositTransactions";

// Import SubscriptionModal
import SubscriptionModal from "@/modal/SubscriptionModal";

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

  // Use our custom hooks
  const {
    userTokenBalance,
    isLoadingTokenBalance,
    currentTokenSymbol,
    loadUserTokenBalance,
  } = useUserBalance(selectedVault);
  const {
    isSubscribed,
    isLoadingSubscription,
    showSubscriptionModal,
    setShowSubscriptionModal,
    checkSubscriptionStatus,
    handleSelectPlan,
    updateSubscriptionStatus,
  } = useSubscription();
  const {
    allDepositTransactions,
    depositTransactions,
    totalTransactions,
    isLoadingDepositTransactions,
    isLoadingMoreTransactions,
    hasMoreTransactions,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    loadDepositTransactions,
    loadMoreDepositTransactions,
  } = useDepositTransactions();

  // Local state
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVaultData, setIsLoadingVaultData] = useState(false);
  const [isLoadingTopTraders, setIsLoadingTopTraders] = useState(false);

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

  // Handle deposit
  const handleDeposit = useCallback(async () => {
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
  }, [depositAmount, selectedVault, user, deposit]);

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
  }, [user, vaults.length, loadVaultData, loadUserTokenBalance, selectedVault]);

  // Load user data when selected vault changes
  useEffect(() => {
    if (selectedVault && user) {
      const userAddress = getUserAddress(user);
      if (userAddress) {
        loadUserData(userAddress);
        loadTopTradersWithLoading(); // Load top traders
        loadTransactionHistory(userAddress);
        loadUserTokenBalance();
        loadDepositTransactions(selectedVault);
        checkSubscriptionStatus(user);

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
    checkSubscriptionStatus,
    vaults,
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

  // Handler functions
  const handleRefreshVaultData = useCallback(() => {
    const userAddress = getUserAddress(user);
    if (userAddress) {
      loadVaultData(userAddress);
    }
  }, [user, loadVaultData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <VaultHeader
        walletInfo={walletInfo}
        isLoadingVaultData={isLoadingVaultData}
        selectedVault={selectedVault}
        onRefreshVaultData={handleRefreshVaultData}
      />

      {/* User Balance */}
      <UserBalanceCard
        user={user}
        userTokenBalance={userTokenBalance}
        isLoadingTokenBalance={isLoadingTokenBalance}
        currentTokenSymbol={currentTokenSymbol}
      />

      {/* Vault Grid */}
      <VaultGrid
        vaults={vaults}
        selectedVault={selectedVault}
        onSelectVault={setSelectedVault}
      />

      {/* Tabs - We'll implement these in the next phase */}
      <Tabs defaultValue="vaults" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vaults">Vault Details</TabsTrigger>
          <TabsTrigger value="my-vaults">My Vaults</TabsTrigger>
          <TabsTrigger value="traders">Top Holders</TabsTrigger>
          <TabsTrigger value="transactions">Deposit Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="vaults" className="space-y-6">
          <VaultDetailsTab
            selectedVault={selectedVault}
            userShares={userShares}
            userTotalDeposited={userTotalDeposited}
            isLoadingSubscription={isLoadingSubscription}
            isSubscribed={isSubscribed}
            showDepositForm={showDepositForm}
            depositAmount={depositAmount}
            isLoading={isLoading}
            onShowSubscriptionModal={() => setShowSubscriptionModal(true)}
            onShowDepositForm={() => setShowDepositForm(true)}
            onHideDepositForm={() => setShowDepositForm(false)}
            onDepositAmountChange={setDepositAmount}
            onDeposit={handleDeposit}
          />
        </TabsContent>

        <TabsContent value="my-vaults" className="space-y-6">
          <MyVaultsTab vaults={vaults} userShares={userShares} />
        </TabsContent>

        <TabsContent value="traders" className="space-y-6">
          <TopHoldersTab
            selectedVault={selectedVault}
            topTraders={topTraders}
            isLoadingTopTraders={isLoadingTopTraders}
            onRefresh={loadTopTradersWithLoading}
            onCopyAddress={(address) => {
              navigator.clipboard.writeText(address);
              toast({
                title: "Copied!",
                description: "Address copied to clipboard",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionsTab
            selectedVault={selectedVault}
            depositTransactions={depositTransactions}
            allDepositTransactions={allDepositTransactions}
            totalTransactions={totalTransactions}
            isLoadingDepositTransactions={isLoadingDepositTransactions}
            isLoadingMoreTransactions={isLoadingMoreTransactions}
            hasMoreTransactions={hasMoreTransactions}
            currentPage={currentPage}
            pageSize={pageSize}
            onLoadMore={() => loadMoreDepositTransactions(selectedVault)}
            onPageSizeChange={setPageSize}
            onPageChange={setCurrentPage}
            onCopyAddress={(address) => {
              navigator.clipboard.writeText(address);
              toast({
                title: "Copied!",
                description: "Address copied to clipboard",
              });
            }}
            onCopyHash={(hash) => {
              navigator.clipboard.writeText(hash);
              toast({
                title: "Copied!",
                description: "Transaction hash copied to clipboard",
              });
            }}
            onViewTransaction={(hash) => {
              window.open(
                `https://hashscan.io/mainnet/transaction/${hash}`,
                "_blank"
              );
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSelectPlan={handleSelectPlan}
        onUpdateSubscriptionStatus={updateSubscriptionStatus}
      />
    </div>
  );
};

export default Vault;
