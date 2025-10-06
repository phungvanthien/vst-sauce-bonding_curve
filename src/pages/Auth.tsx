import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { HashPackConnect } from "@/components/HashPackConnect";
import { toast } from "@/hooks/use-toast";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import LoadingModal from "@/modal/LoadingModal";

const Auth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { walletInfo } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  // Show loading modal during auto connect
  useEffect(() => {
    if (isLoading && walletInfo?.isConnected) {
      setShowLoadingModal(true);
    } else {
      setShowLoadingModal(false);
    }
  }, [isLoading, walletInfo?.isConnected]);

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/vault" replace />;
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-cyrus-background">
        <div className="animate-fadeIn w-full max-w-md space-y-10">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gradient">
              Vistia
            </h1>
            <h1 className="text-5xl font-bold tracking-tight text-gradient">
              Smart Money AI
            </h1>
            <p className="mt-3 text-xl text-cyrus-textSecondary">
              Advanced cryptocurrency trading autobot
            </p>
          </div>

          <div className="cyrus-card mt-10 animate-float">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-cyrus-text">
                  Connect Your Wallet
                </h2>
                <p className="text-sm text-cyrus-textSecondary">
                  Choose your preferred wallet to access the Vistia Dashboard
                </p>
              </div>

              <div className="space-y-4">
                {/* HashPack Connect */}
                <div className="p-4 rounded-md bg-cyrus-card/60 border border-cyrus-border/30">
                  <h3 className="font-medium mb-2">HashPack (Hedera)</h3>
                  <p className="text-sm text-cyrus-textSecondary mb-3">
                    Connect your Hedera wallet for DeFi trading
                  </p>
                  <HashPackConnect />
                </div>

                {/* RainbowKit Connect */}
                <div className="p-4 rounded-md bg-cyrus-card/60 border border-cyrus-border/30">
                  <h3 className="font-medium mb-2">EVM Wallets</h3>
                  <p className="text-sm text-cyrus-textSecondary mb-3">
                    Connect your EVM wallet for DeFi trading
                  </p>
                  <ConnectButton />
                </div>
              </div>

              {/* Connection Status */}
              {walletInfo && (
                <div className="mt-4 p-3 rounded-md bg-cyrus-accent/10 border border-cyrus-accent/20">
                  <div className="text-sm text-cyrus-accent">
                    <strong>Connected:</strong>{" "}
                    {walletInfo.type === "hashpack" ? "HashPack" : "EVM"} Wallet
                  </div>
                  <div className="text-xs text-cyrus-textSecondary mt-1 font-mono">
                    {walletInfo.type === "hashpack"
                      ? walletInfo.accountId
                      : `${walletInfo.address.substring(
                          0,
                          8
                        )}...${walletInfo.address.substring(
                          walletInfo.address.length - 8
                        )}`}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-cyrus-textSecondary">
            By connecting your wallet, you agree to the Terms of Service and
            Privacy Policy
          </p>
        </div>
      </div>

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message="Auto-connecting wallet..."
      />
    </>
  );
};

export default Auth;
