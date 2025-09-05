import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
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
 * - Integration with unified wallet system
 */
export function HashPackConnect() {
  const { walletInfo, connectHashPack, disconnect } = useWallet();

  /**
   * Handles manual wallet connection
   * Opens HashPack pairing modal for user to connect
   */
  const handleConnect = async () => {
    try {
      await connectHashPack();
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

  // Check if HashPack is connected
  const isHashPackConnected =
    walletInfo?.type === "hashpack" && walletInfo?.isConnected;

  // Show account info when connected
  if (isHashPackConnected && walletInfo) {
    return (
      <div className="flex items-center gap-2">
        {/* Connected account display */}
        <Button
          variant="outline"
          size="sm"
          className="text-green-500 border-green-500/50"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {walletInfo.accountId}
        </Button>
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
