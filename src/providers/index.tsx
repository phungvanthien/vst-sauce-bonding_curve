import { HashConnectProvider } from "@/contexts/HashConnectContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { VaultProvider } from "@/contexts/VaultContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HashConnectProvider>
        <AuthProvider>
          <VaultProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </VaultProvider>
        </AuthProvider>
      </HashConnectProvider>
    </QueryClientProvider>
  );
}
