import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useWallet, WalletType } from "./WalletContext";

type User = {
  walletAddress: string;
  accountId?: string; // Optional for EVM wallets
  sessionId: string;
  totalCapital: number;
  bridgedCapital: number;
  activeCapital: number;
  totalSignals: number;
  accurateSignals: number;
  accurateRate: number;
  isActive: boolean;
  walletType: WalletType;
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

        setUser({
          walletAddress,
          accountId: walletType === "hashpack" ? walletAddress : undefined,
          sessionId,
          totalCapital: 5000,
          bridgedCapital: 1500,
          activeCapital: 3500,
          totalSignals: 5000,
          accurateSignals: 3800,
          accurateRate: 76,
          isActive: true,
          walletType: walletType || "hashpack",
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

  // Auto-login when wallet is connected
  useEffect(() => {
    if (walletInfo?.isConnected && !user) {
      const walletAddress =
        walletInfo.type === "hashpack"
          ? walletInfo.accountId!
          : walletInfo.address;
      login(walletAddress, walletInfo.type);
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
        totalCapital: 5000,
        bridgedCapital: 1500,
        activeCapital: 3500,
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

      // Simulate login API call
      await new Promise((resolve) => setTimeout(resolve, SIMULATION_DELAY));

      // Simulate successful response
      const sessionId = `sim_${Math.random().toString(36).substring(2, 15)}`;

      // Store in localStorage
      localStorage.setItem("cyrus_session_id", sessionId);
      localStorage.setItem("cyrus_wallet_address", walletAddress);
      localStorage.setItem("cyrus_wallet_type", walletType);

      // Set the user state
      setUser({
        walletAddress,
        accountId: walletType === "hashpack" ? walletAddress : undefined,
        sessionId,
        totalCapital: 25000,
        bridgedCapital: 15000,
        activeCapital: 10000,
        totalSignals: 5000,
        accurateSignals: 3800,
        accurateRate: 76,
        isActive: true,
        walletType,
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
    if (walletInfo?.type === "evm") {
      disconnect();
    }

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
