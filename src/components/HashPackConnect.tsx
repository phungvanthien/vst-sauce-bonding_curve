import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { useHashConnect } from "@/contexts/HashConnectContext";
import { useAuth } from "@/contexts/AuthContext";
import { HashConnectConnectionState } from "hashconnect";
import { toast } from "@/hooks/use-toast";

/**
 * HashPack Connect Component
 *
 * A UI component that handles HashPack wallet connection and displays connection status.
 * Provides buttons for connecting, disconnecting, and shows account information when connected.
 *
 * Features:
 * - Connect button for manual wallet connection
 * - Disconnect button to remove wallet connection
 * - Loading states during connection attempts
 * - Account ID display when connected
 * - Integration with authentication system
 */
export function HashPackConnect() {
  const {
    connectionState,
    pairingData,
    isConnecting,
    isAutoConnecting,
    connect,
    disconnect,
  } = useHashConnect();
  const { login, user } = useAuth();

  /**
   * Handles manual wallet connection
   * Opens HashPack pairing modal for user to connect
   */
  const handleConnect = async () => {
    console.log("🔍 HashPackConnect: handleConnect called");
    try {
      console.log("🔍 HashPackConnect: calling connect()");
      await connect();
      console.log("🔍 HashPackConnect: connect() completed");
    } catch (error) {
      console.error("❌ HashPackConnect: Failed to connect:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to HashPack wallet",
        variant: "destructive",
      });
    }
  };

  /**
   * Handles login after successful connection
   */
  const handleLogin = async () => {
    if (pairingData && pairingData.accountIds[0]) {
      try {
        await login(pairingData.accountIds[0], 'hashpack');
      } catch (error) {
        console.error("Login failed:", error);
        toast({
          title: "Login Failed",
          description: "Failed to login with HashPack wallet",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * Handles wallet disconnection
   * Disconnects from HashPack and shows notification
   */
  const handleDisconnect = async () => {
    try {
      // Disconnect from HashPack
      disconnect();

      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from HashPack",
      });
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect from HashPack",
        variant: "destructive",
      });
    }
  };

  // Connection state checks
  const isPaired = connectionState === HashConnectConnectionState.Paired;
  const isConnected = connectionState === HashConnectConnectionState.Connected;
  const isLoading =
    isConnecting ||
    isAutoConnecting ||
    connectionState === HashConnectConnectionState.Connecting;

  // Show account info when paired with wallet
  if (isPaired && pairingData) {
    const accountId = pairingData.accountIds[0];

    return (
      <div className="flex items-center gap-2">
        {/* Connected account display */}
        <Button
          variant="outline"
          size="sm"
          className="text-green-500 border-green-500/50"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {accountId}
        </Button>
        {/* Login button if not authenticated */}
        {!user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogin}
            className="text-cyrus-accent hover:bg-cyrus-accent/10"
          >
            Login
          </Button>
        )}
        {/* Disconnect button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Show loading state during connection attempts
  if (isLoading) {
    const loadingText = isAutoConnecting
      ? "Auto-connecting..."
      : "Connecting...";
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {loadingText}
      </Button>
    );
  }

  // Show connect button when not connected
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleConnect}
      className="hover:bg-cyrus-accent/10 hover:border-cyrus-accent/50 hover:text-cyrus-accent"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect HashPack
    </Button>
  );
} 