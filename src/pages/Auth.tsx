import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHashConnect } from "@/contexts/HashConnectContext";
import { HashPackConnect } from "@/components/HashPackConnect";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const { connectionState, pairingData } = useHashConnect();
  const [isConnecting, setIsConnecting] = useState(false);
  // MetaMask functionality removed - only HashPack supported

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/Portfolio" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-cyrus-background">
      <div className="animate-fadeIn w-full max-w-md space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gradient">
            Vistia
          </h1>
          <h1 className="text-5xl font-bold tracking-tight text-gradient">
            Technical Analytic Signals
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
                Choose your preferred wallet to access the Vistia Signals Dashboard
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

              {/* MetaMask Connect - Removed */}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-cyrus-textSecondary">
          By connecting your wallet, you agree to the Terms of Service and
          Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
