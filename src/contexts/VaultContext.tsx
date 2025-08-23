import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import {
  VaultService,
  VaultState,
  TraderInfo,
  Transaction,
  WithdrawStatus,
} from "@/services/vaultService";
import {
  Vault,
  createRealVault,
  validateVaultForDeposit,
  validateVaultForWithdraw,
} from "@/utils/vault-utils";
import {
  getUserAddress,
  isUserConnected,
  validateUserPermissions,
  accountIdToEvmAddress,
} from "@/utils/account-utils";
import { validateTokenAmount, isHBARToken } from "@/utils/token-utils";
import { HEDERA_CONFIG } from "@/config/hederaConfig";
import { toast } from "@/hooks/use-toast";

interface VaultContextType {
  vaults: Vault[];
  selectedVault: Vault | null;
  setSelectedVault: (vault: Vault) => void;

  // User data
  userShares: number;
  userTotalDeposited: number;
  userTokenBalance: number;

  // Vault states and data
  vaultStates: Record<string, VaultState>;
  topTraders: TraderInfo[];
  transactionHistory: Transaction[];
  withdrawStatus: WithdrawStatus | null;

  // Operations
  loadVaultData: () => Promise<void>;
  loadUserData: () => Promise<void>;
  loadTopTraders: () => Promise<void>;
  loadTransactionHistory: () => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  approveToken: (amount: number) => Promise<boolean>;
  requestWithdraw: () => Promise<void>;
  checkWithdrawStatus: () => Promise<void>;

  // User-specific vault service instance
  getUserVaultService: () => VaultService | null;
}

const VaultContext = createContext<VaultContextType | null>(null);

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

  // User data
  const [userShares, setUserShares] = useState(0);
  const [userTotalDeposited, setUserTotalDeposited] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState(0);

  // Vault states and data
  const [vaultStates, setVaultStates] = useState<Record<string, VaultState>>(
    {}
  );
  const [topTraders, setTopTraders] = useState<TraderInfo[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );
  const [withdrawStatus, setWithdrawStatus] = useState<WithdrawStatus | null>(
    null
  );

  // Single vault service instance for the context
  const [vaultService, setVaultService] = useState<VaultService | null>(null);

  // Get or create vault service
  const getUserVaultService = useCallback((): VaultService | null => {
    if (!vaultService) {
      // Create service with default config
      const newService = new VaultService();
      setVaultService(newService);
      return newService;
    }
    return vaultService;
  }, [vaultService]);

  // Initialize vaults
  useEffect(() => {
    const initializeVaults = async () => {
      // Debug environment variables
      console.log("[VaultContext] 🔧 Environment variables:", {
        VITE_VAULT_ADDRESS: import.meta.env.VITE_VAULT_ADDRESS,
        VITE_TOKEN_ADDRESS: import.meta.env.VITE_TOKEN_ADDRESS,
        HEDERA_CONFIG: HEDERA_CONFIG.contracts,
      });

      // Initialize only real vault
      const vaultsList: Vault[] = [];

      if (HEDERA_CONFIG.development.enableRealContract) {
        const realVault = createRealVault();
        vaultsList.push(realVault);

        if (HEDERA_CONFIG.development.enableLogging) {
          console.log("[VaultContext] ✅ Real vault added:", realVault);
        }
      }

      setVaults(vaultsList);
    };

    initializeVaults();
  }, []);

  // Load vault data from smart contract
  const loadVaultData = useCallback(
    async (userAddress?: string) => {
      if (!userAddress) return;
      try {
        // Only load real vault data
        const realVault = vaults.find((v) => v.isReal);
        if (!realVault) {
          console.log(
            "[VaultContext] ℹ️ No real vault found, skipping real-time updates"
          );
          return;
        }

        console.log(
          "[VaultContext] 📊 Loading real vault data:",
          realVault.name
        );

        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Set vault contract for real vault
        vaultService.setVaultContract(realVault.vaultAddress);

        // Get real vault state
        const vaultState = await vaultService.getVaultInfo(
          realVault.vaultAddress
        );

        // Update vault states
        setVaultStates((prev) => ({
          ...prev,
          [realVault.vaultAddress]: vaultState,
        }));

        // Update real vault data with timestamps and APY from getVaultInfo
        console.log("[VaultContext] 🔍 Vault state:", vaultState.apy);
        setVaults((prev) =>
          prev.map((v) =>
            v.id === realVault.id
              ? {
                  ...v,
                  totalShares: vaultState.totalShares,
                  shareholderCount: vaultState.shareholderCount,
                  depositsClosed: vaultState.depositsClosed,
                  withdrawalsEnabled: vaultState.withdrawalsEnabled,
                  totalDeposits: vaultState.totalBalance,
                  runTimestamp: vaultState.runTimestamp,
                  stopTimestamp: vaultState.stopTimestamp,
                  apy: (vaultState as any).apy ?? v.apy,
                }
              : v
          )
        );

        console.log("[VaultContext] ✅ Real vault updated successfully");

        // Load user token balance only for real vault
        if (vaultState.token1Address) {
          const balanceSmallest = await vaultService.getTokenBalance(
            vaultState.token1Address,
            userAddress
          );
          const tokenDecimals = realVault.token === "HBAR" ? 8 : 6;
          const balanceInUnits = balanceSmallest / Math.pow(10, tokenDecimals);
          setUserTokenBalance(balanceInUnits);
        }
      } catch (error) {
        console.error("[VaultContext] Error loading real vault data:", error);
      }
    },
    [vaults, getUserVaultService]
  );

  // Load user data for selected vault
  const loadUserData = useCallback(
    async (userAddress?: string) => {
      if (!selectedVault || !userAddress) return;

      console.log(
        "[VaultContext] 👤 Loading user data for vault:",
        selectedVault.name
      );

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        vaultService.setVaultContract(selectedVault.vaultAddress);

        // Convert user address to EVM address for getUserShares
        const evmUserAddress = await accountIdToEvmAddress(userAddress);
        const shares = await vaultService.getUserShares(evmUserAddress);

        // In this vault, shares = deposited amount (1:1 ratio)
        const totalDeposited = shares;

        setUserShares(shares);
        setUserTotalDeposited(totalDeposited);

        console.log("[VaultContext] ✅ Real user data loaded:", {
          shares,
          totalDeposited,
        });
      } catch (error) {
        console.error("[VaultContext] ❌ Error loading real user data:", error);
        setUserShares(0);
        setUserTotalDeposited(0);
      }
    },
    [selectedVault, getUserVaultService]
  );

  // Load top traders
  const loadTopTraders = useCallback(
    async (limit: number = 10) => {
      if (!selectedVault) return;

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        const traders = await vaultService.getTopTraders(limit);
        setTopTraders(traders);
      } catch (error) {
        console.error("[VaultContext] Error loading top traders:", error);
        setTopTraders([]);
      }
    },
    [selectedVault, getUserVaultService]
  );

  // Load transaction history
  const loadTransactionHistory = useCallback(
    async (userAddress?: string) => {
      if (!selectedVault) return;

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Note: getTransactionHistory method doesn't exist in the new VaultService
        // For now, we'll use an empty array
        const transactions: Transaction[] = [];
        setTransactionHistory(transactions);
      } catch (error) {
        console.error(
          "[VaultContext] Error loading transaction history:",
          error
        );
        setTransactionHistory([]);
      }
    },
    [selectedVault, getUserVaultService]
  );

  // Approve token
  const approveToken = useCallback(
    async (amount: number, userAddress?: string) => {
      if (!selectedVault || !userAddress) {
        throw new Error("No vault selected or user not connected");
      }

      // Check if vault uses HBAR (no approval needed)
      if (isHBARToken(selectedVault.token)) {
        console.log("[VaultContext] ℹ️ HBAR vault - no approval needed");
        toast({
          title: "No Approval Needed",
          description: "HBAR deposits don't require token approval",
        });
        return true;
      }

      console.log("[VaultContext] 🔐 Starting token approval...", {
        vault: selectedVault.name,
        amount,
      });

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Set vault contract if real vault
        if (selectedVault.isReal) {
          console.log(
            "[VaultContext] 🔧 Setting vault contract for approval..."
          );
          vaultService.setVaultContract(selectedVault.vaultAddress);
        }

        console.log(
          "[VaultContext] 👤 User address for approval:",
          userAddress
        );

        // Get token1Address from vault state
        const vaultState = vaultStates[selectedVault.vaultAddress];
        const token1Address =
          vaultState?.token1Address || selectedVault.tokenAddress;

        console.log(
          "[VaultContext] 🔐 Approving tokens with dynamic token1Address...",
          {
            token1Address: token1Address,
            configTokenAddress: selectedVault.tokenAddress,
            vaultAddress: selectedVault.vaultAddress,
          }
        );

        toast({
          title: "Approving tokens",
          description:
            "Please approve token spending in your wallet (max value)",
        });

        const approveTx = await vaultService.approveToken(
          token1Address,
          selectedVault.vaultAddress,
          amount
        );

        console.log(
          "[VaultContext] ✅ Approve transaction sent:",
          approveTx.transactionId
        );

        toast({
          title: "Waiting for approval",
          description: "Please wait for approval transaction to complete...",
        });

        const receipt = await vaultService.waitForReceipt(approveTx);
        console.log("[VaultContext] ✅ Approve receipt:", receipt);

        toast({
          title: "Approval successful",
          description: "Tokens approved for vault deposit",
        });

        return true;
      } catch (error) {
        console.error("[VaultContext] ❌ Approval error:", error);

        // If it's a connection error, show helpful message
        if ((error as any).message?.includes("HashConnect not connected")) {
          console.log("[VaultContext] 🔄 Connection error detected...");
          toast({
            title: "Connection Error",
            description: "Please connect your HashPack wallet first.",
            variant: "destructive",
          });
        }

        throw error;
      }
    },
    [selectedVault, vaultStates, getUserVaultService]
  );

  // Deposit into vault
  const deposit = useCallback(
    async (amount: number, userAddress?: string) => {
      if (!selectedVault || !userAddress) {
        throw new Error("No vault selected or user not connected");
      }

      validateVaultForDeposit(selectedVault);
      validateTokenAmount(amount, userTokenBalance, selectedVault.token);

      console.log("[VaultContext] 💰 Starting deposit process...", {
        vault: selectedVault.name,
        amount,
        isRealVault: selectedVault.isReal,
      });

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Set vault contract
        console.log("[VaultContext] 🔧 Setting vault contract for deposit...");
        vaultService.setVaultContract(selectedVault.vaultAddress);

        // Execute deposit via HashConnect
        console.log(
          "[VaultContext] 🔗 Starting HashConnect deposit process..."
        );
        toast({
          title: "Processing deposit",
          description: "Please confirm transactions in HashPack wallet",
        });

        const depositResult = await vaultService.deposit(amount);
        console.log(
          "[VaultContext] ✅ HashConnect deposit completed:",
          depositResult
        );

        if (depositResult) {
          console.log(
            "[VaultContext] ✅ HashConnect deposit completed successfully"
          );

          const transactionId =
            (depositResult as any)?.transactionId ||
            (depositResult as any)?.transaction_id;
          if (transactionId) {
            console.log(
              "[VaultContext] 🔎 Deposit transaction ID:",
              transactionId
            );
          }
        } else {
          console.log(
            "[VaultContext] ℹ️ Transaction submitted via HashConnect, assuming success"
          );
        }

        toast({
          title: "Success",
          description: `Successfully deposited ${amount} ${selectedVault.token}`,
        });

        // Refresh data
        await Promise.all([
          loadVaultData(userAddress),
          loadUserData(userAddress),
          loadTopTraders(),
          loadTransactionHistory(userAddress),
        ]);
      } catch (error) {
        console.error("[VaultContext] ❌ Deposit error:", error);
        throw error;
      }
    },
    [
      selectedVault,
      userTokenBalance,
      userShares,
      userTotalDeposited,
      loadVaultData,
      loadUserData,
      loadTopTraders,
      loadTransactionHistory,
      getUserVaultService,
    ]
  );

  // Withdraw from vault
  const withdraw = useCallback(
    async (amount: number, userAddress?: string) => {
      if (!selectedVault || !userAddress) {
        throw new Error("No vault selected or user not connected");
      }

      validateVaultForWithdraw(selectedVault);

      if (amount > userShares) {
        throw new Error("Insufficient shares for withdrawal");
      }

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Withdraw from vault
        toast({
          title: "Withdrawing",
          description: "Please confirm withdrawal transaction in your wallet",
        });

        const withdrawTx = await vaultService.withdraw();
        await vaultService.waitForReceipt(withdrawTx);

        toast({
          title: "Success",
          description: `Successfully withdrawn ${amount} shares`,
        });

        // Refresh data
        await Promise.all([
          loadVaultData(userAddress),
          loadUserData(userAddress),
          loadTopTraders(),
          loadTransactionHistory(userAddress),
        ]);
      } catch (error) {
        console.error("[VaultContext] Withdraw error:", error);
        throw error;
      }
    },
    [
      selectedVault,
      userShares,
      userTotalDeposited,
      loadVaultData,
      loadUserData,
      loadTopTraders,
      loadTransactionHistory,
      getUserVaultService,
    ]
  );

  // Check withdraw status
  const checkWithdrawStatus = useCallback(
    async (userAddress?: string) => {
      if (!selectedVault) return;

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        const status = await vaultService.checkWithdrawStatus(
          selectedVault.vaultAddress
        );
        setWithdrawStatus(status);
      } catch (error) {
        console.error("[VaultContext] Error checking withdraw status:", error);
        setWithdrawStatus({
          canWithdraw: false,
          isProcessing: false,
          message: "Error checking withdraw status",
        });
      }
    },
    [selectedVault, getUserVaultService]
  );

  // Request withdraw
  const requestWithdraw = useCallback(
    async (userAddress?: string) => {
      console.log("[VaultContext] 🔍 requestWithdraw called from VaultContext");

      if (!selectedVault || !userAddress) {
        toast({
          title: "Error",
          description: "Please select a vault and connect wallet",
          variant: "destructive",
        });
        return;
      }

      try {
        const vaultService = getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Check withdraw status first
        const status = await vaultService.checkWithdrawStatus(
          selectedVault.vaultAddress
        );

        if (!status.canWithdraw) {
          toast({
            title: "Cannot Withdraw",
            description: status.message,
            variant: "destructive",
          });
          return;
        }

        // Execute withdraw request (using withdraw method instead of requestWithdraw)
        const tx = await vaultService.withdraw();

        // Wait for transaction confirmation
        const receipt = await vaultService.waitForReceipt(tx);

        toast({
          title: "Withdraw Successful",
          description: `Transaction confirmed: ${vaultService.formatHash(
            (receipt as any).transaction_id ||
              (receipt as any).transactionId ||
              "unknown"
          )}`,
        });

        // Refresh data after successful withdraw
        await Promise.all([
          loadVaultData(userAddress),
          loadUserData(userAddress),
          loadTopTraders(),
          loadTransactionHistory(userAddress),
        ]);
      } catch (error) {
        console.error("[VaultContext] Error requesting withdraw:", error);
        toast({
          title: "Withdraw Failed",
          description:
            (error as any) instanceof Error
              ? (error as any).message
              : "Failed to process withdraw request",
          variant: "destructive",
        });
      }
    },
    [
      selectedVault,
      loadVaultData,
      loadUserData,
      loadTopTraders,
      loadTransactionHistory,
      getUserVaultService,
    ]
  );

  return (
    <VaultContext.Provider
      value={{
        vaults,
        selectedVault,
        setSelectedVault,
        userShares,
        userTotalDeposited,
        userTokenBalance,
        vaultStates,
        topTraders,
        transactionHistory,
        withdrawStatus,
        loadVaultData,
        loadUserData,
        loadTopTraders,
        loadTransactionHistory,
        deposit,
        withdraw,
        approveToken,
        requestWithdraw,
        checkWithdrawStatus,
        getUserVaultService,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
};
