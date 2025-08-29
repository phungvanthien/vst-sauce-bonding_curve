import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
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
  createMultipleVaults,
  validateVaultForDeposit,
} from "@/utils/vault-utils";
import { accountIdToEvmAddress } from "@/utils/account-utils";
import { isHBARToken } from "@/utils/token-utils";
import { VAULTS_CONFIG } from "@/config/hederaConfig";
import { toast } from "@/hooks/use-toast";

interface VaultContextType {
  vaults: Vault[];
  selectedVault: Vault | null;
  setSelectedVault: (vault: Vault) => void;

  // User data
  userShares: number;
  userTotalDeposited: number;

  // Vault states and data
  vaultStates: Record<string, VaultState>;
  topTraders: TraderInfo[];
  transactionHistory: Transaction[];
  withdrawStatus: WithdrawStatus | null;

  // Operations
  loadVaultData: (userAddress: string) => Promise<void>;
  loadUserData: (userAddress: string) => Promise<void>;
  loadTopTraders: () => Promise<void>;
  loadTransactionHistory: (userAddress: string) => Promise<void>;
  deposit: (amount: number, userAddress: string) => Promise<void>;
  approveToken: (amount: number, userAddress: string) => Promise<boolean>;
  checkWithdrawStatus: () => Promise<void>;

  // User-specific vault service instance
  getUserVaultService: () => Promise<VaultService | null>;

  // HashConnect integration
  setHashConnectData: (manager: any, pairingData: any) => void;

  // Vault info retrieval
  callGetVaultInfo: (vaultAddress: string) => Promise<VaultState | null>;
}

const VaultContext = createContext<VaultContextType | null>(null);

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

  // User data
  const [userShares, setUserShares] = useState(0);
  const [userTotalDeposited, setUserTotalDeposited] = useState(0);

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

  // Ref to track if we're currently loading vault data to prevent infinite loops
  const isLoadingVaultData = useRef(false);

  // Get or create vault service
  const getUserVaultService =
    useCallback(async (): Promise<VaultService | null> => {
      if (!vaultService) {
        // Create service with vault contract configuration
        const newService = new VaultService({
          vaultAddress: import.meta.env.VITE_VAULT_ADDRESS,
        });

        // Initialize vault contract asynchronously
        try {
          await newService.initializeVaultContract();
          console.log("✅ VaultService initialized successfully");
        } catch (error) {
          console.error("❌ Error initializing VaultService:", error);
        }

        setVaultService(newService);
        return newService;
      }
      return vaultService;
    }, [vaultService]);

  // Call getVaultInfo and return vault state
  const callGetVaultInfo = useCallback(
    async (vaultAddress: string) => {
      try {
        console.log("🔍 Calling getVaultInfo for vault address:", vaultAddress);

        const vaultService = await getUserVaultService();
        if (!vaultService) {
          console.error("Vault service not available");
          return null;
        }

        // Set vault contract first
        await vaultService.setVaultContract(vaultAddress);

        // Call getVaultInfo
        const vaultInfo = await vaultService.getVaultInfo(vaultAddress);

        console.log("📊 Vault Info Result:", {
          vaultAddress: vaultAddress,
          vaultInfo: vaultInfo,
        });

        return vaultInfo;
      } catch (error) {
        console.error("❌ Error calling getVaultInfo:", error);
        return null;
      }
    },
    [getUserVaultService]
  );

  // Set HashConnect data for vault service
  const setHashConnectData = useCallback(
    (manager: any, pairingData: any) => {
      if (vaultService) {
        vaultService.setManagerAndPairingData(manager, pairingData);
      }
    },
    [vaultService]
  );

  // Initialize vaults
  useEffect(() => {
    const initializeVaults = async () => {
      const vaultsList: Vault[] = [];

      try {
        // Get vault info for all configured vaults
        const vaultInfos: Record<string, VaultState> = {};

        for (const vaultConfig of VAULTS_CONFIG.vaults) {
          // Skip vaults without addresses
          if (!vaultConfig.vaultAddress) {
            console.log(
              `[VaultContext] Skipping vault ${vaultConfig.name} - no address configured`
            );
            continue;
          }

          try {
            const vaultInfo = await callGetVaultInfo(vaultConfig.vaultAddress);
            if (vaultInfo) {
              vaultInfos[vaultConfig.vaultAddress] = vaultInfo;
              console.log(
                `[VaultContext] ✅ Got vault info for ${vaultConfig.name}:`,
                vaultInfo
              );
            } else {
              console.log(
                `[VaultContext] ❌ Could not get vault info for ${vaultConfig.name}`
              );
            }
          } catch (error) {
            console.log(
              `[VaultContext] ❌ Error getting vault info for ${vaultConfig.name}:`,
              error
            );
          }
        }

        // Create multiple vaults from config and vault infos
        const createdVaults = createMultipleVaults(vaultInfos);
        vaultsList.push(...createdVaults);

        console.log(
          `[VaultContext] ✅ Initialized ${vaultsList.length} vaults`
        );
      } catch (error) {
        console.log("[VaultContext] ❌ Error initializing vaults:", error);
      }

      console.log("[VaultContext] Initialize vaults:", vaultsList);
      setVaults(vaultsList);
    };

    initializeVaults();
  }, [callGetVaultInfo]);

  // Load vault data from smart contract
  const loadVaultData = useCallback(
    async (userAddress: string) => {
      if (!userAddress) return;

      // Prevent concurrent calls
      if (isLoadingVaultData.current) {
        console.log(
          "[VaultContext] 🔄 Already loading vault data, skipping..."
        );
        return;
      }

      isLoadingVaultData.current = true;

      try {
        // Get current vaults state
        const currentVaults = vaults;
        if (currentVaults.length === 0) {
          console.log(
            "[VaultContext] ℹ️ No vaults found, skipping real-time updates"
          );
          return;
        }

        console.log(
          `[VaultContext] 📊 Loading data for ${currentVaults.length} vaults`
        );

        const vaultService = await getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Update all vaults
        const updatedVaults = await Promise.all(
          currentVaults.map(async (vault) => {
            try {
              // Set vault contract
              await vaultService.setVaultContract(vault.vaultAddress);

              // Get vault state
              const vaultState = await vaultService.getVaultInfo(
                vault.vaultAddress
              );

              // Update vault states
              setVaultStates((prev) => ({
                ...prev,
                [vault.vaultAddress]: vaultState,
              }));

              // Return updated vault
              return {
                ...vault,
                totalShares: vaultState.totalShares,
                shareholderCount: vaultState.shareholderCount,
                depositsClosed: vaultState.depositsClosed,
                withdrawalsEnabled: vaultState.withdrawalsEnabled,
                totalDeposits: vaultState.totalBalance,
                runTimestamp: vaultState.runTimestamp,
                stopTimestamp: vaultState.stopTimestamp,
                apy: (vaultState as any).apy ?? vault.apy,
              };
            } catch (error) {
              console.error(
                `[VaultContext] Error updating vault ${vault.name}:`,
                error
              );
              return vault; // Return unchanged vault on error
            }
          })
        );

        setVaults(updatedVaults);
        console.log("[VaultContext] ✅ All vaults updated successfully");
      } catch (error) {
        console.error("[VaultContext] Error loading vault data:", error);
      } finally {
        isLoadingVaultData.current = false;
      }
    },
    [getUserVaultService]
  );

  // Load user data for selected vault
  const loadUserData = useCallback(
    async (userAddress: string) => {
      if (!selectedVault || !userAddress) return;

      console.log(
        "[VaultContext] 👤 Loading user data for vault:",
        selectedVault.name
      );

      try {
        const vaultService = await getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        await vaultService.setVaultContract(selectedVault.vaultAddress);

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
        const vaultService = await getUserVaultService();
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
    async (userAddress: string) => {
      if (!selectedVault) return;

      try {
        const vaultService = await getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // TODO: Implement proper transaction history
        // For now, keep an empty array
        setTransactionHistory([]);
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
    async (amount: number, userAddress: string) => {
      if (!selectedVault) {
        throw new Error("No vault selected not connected");
      }
      if (!userAddress) {
        throw new Error("No user address provided");
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
        const vaultService = await getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Set vault contract
        console.log("[VaultContext] 🔧 Setting vault contract for approval...");
        await vaultService.setVaultContract(selectedVault.vaultAddress);

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
    async (amount: number, userAddress: string) => {
      if (!selectedVault) {
        throw new Error("No vault selected not connected");
      }
      if (!userAddress) {
        throw new Error("No user address provided");
      }

      validateVaultForDeposit(selectedVault);

      console.log("[VaultContext] 💰 Starting deposit process...", {
        vault: selectedVault.name,
        amount,
      });

      try {
        const vaultService = await getUserVaultService();
        if (!vaultService) {
          throw new Error("Vault service not available");
        }

        // Set vault contract
        console.log("[VaultContext] 🔧 Setting vault contract for deposit...");
        await vaultService.setVaultContract(selectedVault.vaultAddress);

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
        const vaultService = await getUserVaultService();
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

  return (
    <VaultContext.Provider
      value={{
        vaults,
        selectedVault,
        setSelectedVault,
        userShares,
        userTotalDeposited,
        vaultStates,
        topTraders,
        transactionHistory,
        withdrawStatus,
        loadVaultData,
        loadUserData,
        loadTopTraders,
        loadTransactionHistory,
        deposit,
        approveToken,
        checkWithdrawStatus,
        getUserVaultService,
        setHashConnectData,
        callGetVaultInfo,
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
