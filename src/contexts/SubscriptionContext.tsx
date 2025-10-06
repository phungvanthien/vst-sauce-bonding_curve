import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { SubscriptionService } from "@/services/subscriptionService";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";

interface SubscriptionContextType {
  subscriptionService: SubscriptionService | null;
  isInitialized: boolean;
  initializeSubscriptionService: () => Promise<void>;
  processSubscriptionPayment: (
    planName: string,
    amount: number,
    userAddress: string,
    userAccountId: string,
    userId: number
  ) => Promise<any>;
  getSubscriptionPlans: () => any[];
  getSubscriptionPlan: (planId: number) => any;
  getServiceStatus: () => any;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const [subscriptionService, setSubscriptionService] =
    useState<SubscriptionService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { user } = useAuth();
  const { walletInfo } = useWallet();

  // Auto-initialize when user and wallet are available
  useEffect(() => {
    const autoInitialize = async () => {
      if (user && walletInfo && !isInitialized) {
        try {
          console.log("🔄 Auto-initializing SubscriptionService...");
          // Create new subscription service instance
          const service = new SubscriptionService();

          // Configure service based on wallet type
          if (
            walletInfo.type === "hashpack" &&
            walletInfo.manager &&
            walletInfo.pairingData
          ) {
            service.setManagerAndPairingData(
              walletInfo.manager,
              walletInfo.pairingData
            );
          } else if (walletInfo.type === "evm" && walletInfo.evmSigner) {
            service.setEVMSigner(walletInfo.evmSigner);
          }

          // Initialize the service
          await service.initialize();

          setSubscriptionService(service);
          setIsInitialized(true);

          console.log("✅ SubscriptionService auto-initialized successfully");
        } catch (error) {
          console.warn("⚠️ Auto-initialization failed:", error);
        }
      }
    };

    autoInitialize();
  }, [user, walletInfo, isInitialized]);

  const initializeSubscriptionService = useCallback(async () => {
    try {
      // Create new subscription service instance
      const service = new SubscriptionService();

      // Configure service based on wallet type
      if (walletInfo) {
        if (
          walletInfo.type === "hashpack" &&
          walletInfo.manager &&
          walletInfo.pairingData
        ) {
          service.setManagerAndPairingData(
            walletInfo.manager,
            walletInfo.pairingData
          );
        } else if (walletInfo.type === "evm" && walletInfo.evmSigner) {
          service.setEVMSigner(walletInfo.evmSigner);
        }
      }

      // Initialize the service
      await service.initialize();

      setSubscriptionService(service);
      setIsInitialized(true);

      console.log("✅ SubscriptionService initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing SubscriptionService:", error);
      throw error;
    }
  }, [walletInfo]);

  const processSubscriptionPayment = useCallback(
    async (
      planName: string,
      amount: number,
      userAddress: string,
      userAccountId: string,
      userId: number
    ) => {
      if (!subscriptionService) {
        throw new Error("SubscriptionService not initialized");
      }
      return await subscriptionService.processSubscriptionPayment(
        planName,
        amount,
        userAddress,
        userAccountId,
        userId
      );
    },
    [subscriptionService]
  );

  const getSubscriptionPlans = useCallback(() => {
    if (!subscriptionService) {
      return [];
    }
    return subscriptionService.getSubscriptionPlans();
  }, [subscriptionService]);

  const getSubscriptionPlan = useCallback(
    (planId: number) => {
      if (!subscriptionService) {
        return null;
      }
      return subscriptionService.getSubscriptionPlan(planId);
    },
    [subscriptionService]
  );

  const getServiceStatus = useCallback(() => {
    if (!subscriptionService) {
      return {
        initialized: false,
        walletType: "none",
        baseUrl: "not configured",
        vstTokenAddress: "not configured",
        subscriptionWalletAddress: "not configured",
        subscriptionWalletAccountId: "not configured",
        evmSignerConfigured: false,
      };
    }
    return subscriptionService.getStatus();
  }, [subscriptionService]);

  const value: SubscriptionContextType = {
    subscriptionService,
    isInitialized,
    initializeSubscriptionService,
    processSubscriptionPayment,
    getSubscriptionPlans,
    getSubscriptionPlan,
    getServiceStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscriptionService(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscriptionService must be used within a SubscriptionProvider"
    );
  }
  return context;
}
