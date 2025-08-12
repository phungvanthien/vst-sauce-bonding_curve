import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { vaultService } from '@/services/vaultService';
import { HEDERA_CONFIG } from '@/config/hederaConfig';
import { toast } from '@/hooks/use-toast';

interface VaultDebugInfoProps {
  selectedVault: any;
  userTokenBalance: number;
}

const VaultDebugInfo: React.FC<VaultDebugInfoProps> = ({ selectedVault, userTokenBalance }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  const checkBalance = async () => {
    if (!user || !selectedVault) return;
    
    setIsLoading(true);
    try {
      const userAddress = user.walletType === 'hashpack' ? user.accountId : user.walletAddress;
      
      // Initialize contracts if real vault
      if (selectedVault.id === 4) {
        await vaultService.initializeContracts(selectedVault.vaultAddress, selectedVault.tokenAddress);
      }
      
      const balance = await vaultService.getTokenBalance(selectedVault.tokenAddress, userAddress);
      
      setDebugInfo({
        userAddress,
        tokenAddress: selectedVault.tokenAddress,
        vaultAddress: selectedVault.vaultAddress,
        balance,
        isRealVault: selectedVault.id === 4,
        envVars: {
          VITE_VAULT_ADDRESS: import.meta.env.VITE_VAULT_ADDRESS,
          VITE_TOKEN_ADDRESS: import.meta.env.VITE_TOKEN_ADDRESS,
          VAULT_ADDRESS: import.meta.env.VAULT_ADDRESS,
          TOKEN_ADDRESS: import.meta.env.TOKEN_ADDRESS,
        }
      });
      
      toast({
        title: "Balance Check",
        description: `Current balance: ${balance} ${selectedVault.token}`,
      });
    } catch (error) {
      console.error('Error checking balance:', error);
      toast({
        title: "Error",
        description: "Failed to check balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedVault || selectedVault.id !== 4) return null;

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">🔧 Debug Info (Real Vault)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Vault Address:</span>
            <div className="font-mono text-xs break-all">{selectedVault.vaultAddress}</div>
          </div>
          <div>
            <span className="font-medium">Token Address:</span>
            <div className="font-mono text-xs break-all">{selectedVault.tokenAddress}</div>
          </div>
          <div>
            <span className="font-medium">User Address:</span>
            <div className="font-mono text-xs break-all">
              {user?.accountId || user?.walletAddress || 'Not connected'}
            </div>
          </div>
          <div>
            <span className="font-medium">Current Balance:</span>
            <div className="font-mono">{userTokenBalance} {selectedVault.token}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={checkBalance} 
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isLoading ? 'Checking...' : '🔍 Check Real Balance'}
          </Button>
        </div>

        {debugInfo && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-sm mb-2">Debug Results:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VaultDebugInfo; 