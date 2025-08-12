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
  const [metamaskAvailable, setMetamaskAvailable] = useState(false);

  useEffect(() => {
    // Check if MetaMask is available
    const checkMetamaskAvailable = async () => {
      if (window.ethereum) {
        setMetamaskAvailable(true);
      } else {
        // Wait for MetaMask to be injected into the window
        const metamaskCheckInterval = setInterval(() => {
          if (window.ethereum) {
            setMetamaskAvailable(true);
            clearInterval(metamaskCheckInterval);
          }
        }, 500);

        // Clear interval after 10 seconds if MetaMask is not detected
        setTimeout(() => {
          clearInterval(metamaskCheckInterval);
        }, 10000);
      }
    };

    checkMetamaskAvailable();
  }, []);

  const handleConnectMetaMask = async () => {
    try {
      setIsConnecting(true);

      if (!window.ethereum) {
        throw new Error("MetaMask wallet extension is not installed");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in MetaMask");
      }

      const walletAddress = accounts[0];
      await login(walletAddress, 'metamask');
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not connect to MetaMask wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

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

              {/* MetaMask Connect */}
              <div className="p-4 rounded-md bg-cyrus-card/60 border border-cyrus-border/30">
                <h3 className="font-medium mb-2">MetaMask (Ethereum)</h3>
                <p className="text-sm text-cyrus-textSecondary mb-3">
                  Connect your Ethereum wallet
                </p>
                <button
                  onClick={handleConnectMetaMask}
                  disabled={isConnecting || isLoading || !metamaskAvailable}
                  className="cyrus-button w-full relative overflow-hidden group"
                >
                  {isConnecting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2 transition-transform group-hover:-rotate-12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.5 6L10 18.5M5.5 8.5L2 12L5.5 15.5M18.5 8.5L22 12L18.5 15.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {!metamaskAvailable
                        ? "Install MetaMask"
                        : "Connect MetaMask"}
                    </span>
                  )}
                </button>
              </div>
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
