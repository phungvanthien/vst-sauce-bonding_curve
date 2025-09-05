import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useHashConnect } from "./HashConnectContext";
import { HashConnectConnectionState } from "hashconnect";
import { HashConnectManager } from "@/lib/hashconnect";
import { SessionData } from "hashconnect";
import { ethers } from "ethers";

export type WalletType = "hashpack" | "evm";

export interface WalletInfo {
  type: WalletType;
  address: string;
  accountId?: string; // For Hedera wallets
  isConnected: boolean;
  isConnecting: boolean;
  // HashConnect specific data (only available for HashPack wallets)
  manager?: HashConnectManager;
  pairingData?: SessionData;
  // EVM signer (only available for EVM wallets)
  evmSigner?: any;
}

interface WalletContextType {
  walletInfo: WalletInfo | null;
  connectHashPack: () => Promise<void>;
  connectEVM: () => Promise<void>;
  disconnect: () => void;
  getCurrentWallet: () => WalletInfo | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  // HashPack hooks
  const {
    connectionState,
    pairingData,
    connect: connectHashPack,
    disconnect: disconnectHashPack,
    isConnecting: isHashPackConnecting,
    manager,
  } = useHashConnect();

  // EVM hooks
  const {
    address: evmAddress,
    isConnected: isEVMConnected,
    isConnecting: isEVMConnecting,
    connector,
  } = useAccount();
  const { disconnect: disconnectEVM } = useDisconnect();

  // Update wallet info when HashPack state changes
  useEffect(() => {
    if (
      connectionState === HashConnectConnectionState.Paired &&
      pairingData?.accountIds?.[0]
    ) {
      setWalletInfo({
        type: "hashpack",
        address: pairingData.accountIds[0],
        accountId: pairingData.accountIds[0],
        isConnected: true,
        isConnecting: false,
        manager,
        pairingData,
      });
    } else if (connectionState === HashConnectConnectionState.Disconnected) {
      // Only clear if it was a HashPack wallet
      setWalletInfo((prev) => (prev?.type === "hashpack" ? null : prev));
    }
  }, [connectionState, pairingData, manager]);

  // Update wallet info when EVM state changes
  useEffect(() => {
    if (isEVMConnected && evmAddress && connector) {
      // Get the signer
      const getEVMSigner = async () => {
        try {
          let signer = null;

          // Check if window.ethereum is available (MetaMask, etc.)
          if ((window as any).ethereum) {
            // Wrap window.ethereum in an ethers provider
            const provider = new ethers.providers.Web3Provider(
              (window as any).ethereum
            );
            // Get signer (the connected account)
            signer = provider.getSigner();
          }

          setWalletInfo({
            type: "evm",
            address: evmAddress,
            isConnected: true,
            isConnecting: false,
            evmSigner: signer,
          });
        } catch (error) {
          console.error("Failed to get EVM signer:", error);
          setWalletInfo({
            type: "evm",
            address: evmAddress,
            isConnected: true,
            isConnecting: false,
          });
        }
      };
      getEVMSigner();
    } else if (!isEVMConnected) {
      // Only clear if it was an EVM wallet
      setWalletInfo((prev) => (prev?.type === "evm" ? null : prev));
    }
  }, [isEVMConnected, evmAddress, connector]);

  const connectHashPackWallet = async () => {
    try {
      await connectHashPack();
    } catch (error) {
      console.error("Failed to connect HashPack:", error);
      throw error;
    }
  };

  const connectEVMWallet = async () => {
    // EVM connection is handled by RainbowKit's ConnectButton
    // This function is mainly for consistency in the API
    return Promise.resolve();
  };

  const disconnectWallet = () => {
    if (walletInfo?.type === "hashpack") {
      disconnectHashPack();
    } else if (walletInfo?.type === "evm") {
      disconnectEVM();
    }
    setWalletInfo(null);
  };

  const getCurrentWallet = (): WalletInfo | null => {
    return walletInfo;
  };

  const value: WalletContextType = {
    walletInfo,
    connectHashPack: connectHashPackWallet,
    connectEVM: connectEVMWallet,
    disconnect: disconnectWallet,
    getCurrentWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
