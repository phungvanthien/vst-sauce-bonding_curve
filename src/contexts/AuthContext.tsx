import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useWallet, WalletType } from "./WalletContext";
import { userService, CreateUserResponse } from "@/services/userService";
import { accountIdToEvmAddress } from "@/utils/account-utils";

export type User = {
  walletAddress: string;
  accountId?: string; // Optional for HashPack wallets
  sessionId: string;
  isActive: boolean;
  walletType: WalletType;
  userId?: number; // Database user ID from API
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string, walletType: WalletType) => Promise<void>;
  logout: () => void;
  toggleAgentStatus: () => Promise<void>;
  refreshUserData: () => Promise<void>;
};

// Production API URL - replace with your actual backend URL
const API_URL = "https://api.cyrus-ai.com";
const SIMULATION_DELAY = 800; // ms to simulate network latency

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { walletInfo, disconnect } = useWallet();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const sessionId = localStorage.getItem("cyrus_session_id");
        const walletAddress = localStorage.getItem("cyrus_wallet_address");
        const walletType = localStorage.getItem(
          "cyrus_wallet_type"
        ) as WalletType;

        if (!sessionId || !walletAddress || !walletType) {
          setIsLoading(false);
          return;
        }

        // Simulate session validation
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_DELAY));

        // For existing sessions, we need to handle the conversion
        const evmWalletAddress: string = user.walletAddress;
        const accountId: string = user.accountId;

        setUser({
          walletAddress: evmWalletAddress,
          accountId: accountId,
          sessionId,
          isActive: true,
          walletType: walletType || "hashpack",
          userId: undefined, // Will be set on next login
        });
      } catch (error) {
        console.error("Session validation error:", error);
        localStorage.removeItem("cyrus_session_id");
        localStorage.removeItem("cyrus_wallet_address");
        localStorage.removeItem("cyrus_wallet_type");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Auto-login when wallet is paired (not just connected)
  useEffect(() => {
    if (walletInfo?.isConnected && !user) {
      // For HashPack, only auto-login if we have pairing data (truly paired)
      if (walletInfo.type === "hashpack" && walletInfo.pairingData) {
        const walletAddress = walletInfo.accountId!;
        login(walletAddress, walletInfo.type);
      }
      // For EVM wallets, auto-login when connected (they don't have pairing concept)
      else if (walletInfo.type === "evm") {
        const walletAddress = walletInfo.address;
        login(walletAddress, walletInfo.type);
      }
    }
  }, [walletInfo, user]);

  const refreshUserData = async () => {
    if (!user?.sessionId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, SIMULATION_DELAY));

      // Simulate updated user data
      setUser((prevUser) => ({
        ...prevUser!,
        isActive: prevUser?.isActive || false,
      }));
    } catch (error) {
      console.error("Error refreshing user data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your trading data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (walletAddress: string, walletType: WalletType) => {
    try {
      setIsLoading(true);

      // For HashPack wallets, convert Hedera account ID to EVM alias address
      let evmWalletAddress: string;
      let accountId: string | undefined;

      if (walletType === "hashpack") {
        // Convert Hedera account ID to EVM alias address
        evmWalletAddress = await accountIdToEvmAddress(walletAddress);
        accountId = walletAddress; // Keep original Hedera account ID
      } else {
        // For EVM wallets, use the address directly
        evmWalletAddress = walletAddress;
        accountId = undefined;
      }

      // Ensure user exists in the database (create if doesn't exist)
      let userData: CreateUserResponse;
      try {
        userData = await userService.ensureUserExists(
          evmWalletAddress, // Use EVM address for wallet_address
          accountId, // Use Hedera account ID for account_id
          walletType
        );
      } catch (apiError) {
        console.error("API error during user creation:", apiError);
        // Continue with login even if API fails (fallback to simulation)
        toast({
          title: "Warning",
          description: "User creation failed, using offline mode",
          variant: "destructive",
        });

        // Fallback to simulation mode
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_DELAY));
        userData = {
          id: 0,
          wallet_address: evmWalletAddress, // Use EVM address
          account_id: accountId, // Use Hedera account ID
          wallet_type: walletType,
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }

      // Generate session ID
      const sessionId = `sim_${Math.random().toString(36).substring(2, 15)}`;

      // Store in localStorage
      localStorage.setItem("cyrus_session_id", sessionId);
      localStorage.setItem("cyrus_wallet_address", evmWalletAddress); // Store EVM address
      localStorage.setItem("cyrus_wallet_type", walletType);

      // Set the user state
      setUser({
        walletAddress: evmWalletAddress, // Use EVM address for walletAddress
        accountId: accountId, // Use Hedera account ID for accountId
        sessionId,
        isActive: true,
        walletType,
        userId: userData.id,
      });

      toast({
        title: "Authentication Successful",
        description: `Welcome to Vistia TA Dashboard (${walletType})`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Authentication Failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Disconnect the wallet first (handles both HashPack and EVM)
    disconnect();

    // Clear local storage
    localStorage.removeItem("cyrus_session_id");
    localStorage.removeItem("cyrus_wallet_address");
    localStorage.removeItem("cyrus_wallet_type");

    // Clear user state
    setUser(null);
  };

  const toggleAgentStatus = async () => {
    if (!user) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, SIMULATION_DELAY));

      // Toggle the isActive status
      const newStatus = !user.isActive;
      // Update the user state with the new isActive status
      setUser((prevUser) => ({
        ...prevUser!,
        isActive: newStatus,
      }));

      toast({
        title: newStatus ? "Auto Trading Activated" : "Auto Trading Paused",
        description: newStatus
          ? "Vistia TA is now actively trading"
          : "Trading operations have been paused",
      });
    } catch (error) {
      console.error("Error toggling agent status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update trading agent status",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        toggleAgentStatus,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
