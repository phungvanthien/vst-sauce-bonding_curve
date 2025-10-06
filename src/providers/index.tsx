import { HashConnectProvider } from "@/contexts/HashConnectContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { VaultProvider } from "@/contexts/VaultContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmiConfig";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HashConnectProvider>
        <WagmiProvider config={config}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#121212",
              accentColorForeground: "#F7F7F7",
              overlayBlur: "none",
              borderRadius: "large",
            })}
          >
            <WalletProvider>
              <AuthProvider>
                <VaultProvider>
                  <SubscriptionProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                  </SubscriptionProvider>
                </VaultProvider>
              </AuthProvider>
            </WalletProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </HashConnectProvider>
    </QueryClientProvider>
  );
}
