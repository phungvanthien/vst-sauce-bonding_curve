import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHashConnect } from '@/contexts/HashConnectContext';
import { useAuth } from '@/contexts/AuthContext';

const HashConnectDebug: React.FC = () => {
  const { connectionState, pairingData } = useHashConnect();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  const checkHashConnectStatus = () => {
    try {
      const hashConnect = (window as any).hashConnect;
      const info = {
        windowHashConnect: !!hashConnect,
        hashConnectType: typeof hashConnect,
        connectionState,
        pairingData: pairingData ? {
          accountIds: pairingData.accountIds,
          topic: pairingData.topic,
          network: pairingData.network
        } : null,
        user: user ? {
          walletType: user.walletType,
          accountId: user.accountId,
          walletAddress: user.walletAddress
        } : null,
        methods: hashConnect ? {
          hasGetClient: typeof hashConnect.getClient === 'function',
          hasGetSigner: typeof hashConnect.getSigner === 'function',
          hasIsConnected: typeof hashConnect.isConnected === 'function'
        } : null
      };

      setDebugInfo(info);
      console.log('🔍 HashConnect Debug Info:', info);
    } catch (error) {
      console.error('Error checking HashConnect status:', error);
      setDebugInfo({ error: error.message });
    }
  };

  const testGetClient = async () => {
    try {
      const { hashConnectService } = await import('@/services/hashConnectService');
      
      const client = await hashConnectService.getClient();
      console.log('✅ Client test successful:', client);
      
      // Test Hedera client methods
      if (client && typeof client.getAccountBalance === 'function') {
        console.log('✅ Hedera client methods available');
        alert('Client test successful! Hedera client methods available. Check console for details.');
      } else {
        console.log('⚠️ Hedera client methods not available');
        alert('Client available but Hedera methods not found');
      }
    } catch (error) {
      console.error('❌ Client test failed:', error);
      alert(`Client test failed: ${error.message}`);
    }
  };

  const testGetSigner = async () => {
    try {
      const { hashConnectService } = await import('@/services/hashConnectService');
      
      const signer = await hashConnectService.getSigner();
      console.log('✅ Signer test successful:', signer);
      
      // Test Hedera signer methods
      if (signer && typeof signer.signTransaction === 'function') {
        console.log('✅ Hedera signer methods available');
        alert('Signer test successful! Hedera signer methods available. Check console for details.');
      } else {
        console.log('⚠️ Hedera signer methods not available');
        alert('Signer available but Hedera methods not found');
      }
    } catch (error) {
      console.error('❌ Signer test failed:', error);
      alert(`Signer test failed: ${error.message}`);
    }
  };

  const testVaultState = async () => {
    try {
      const { vaultService } = await import('@/services/vaultService');
      const { HEDERA_CONFIG } = await import('@/config/hederaConfig');
      const { hashConnectService } = await import('@/services/hashConnectService');
      
      console.log('🧪 Testing vault state...');
      console.log('Contract addresses:', HEDERA_CONFIG.contracts);
      
      // Check HashConnect connection first
      const isConnected = await hashConnectService.isConnected();
      if (!isConnected) {
        throw new Error('HashConnect not connected. Please connect your wallet first.');
      }
      
      console.log('✅ HashConnect connected, proceeding with vault state test...');
      
      // Initialize contracts
      await vaultService.initializeContracts(
        HEDERA_CONFIG.contracts.vaultContractId,
        HEDERA_CONFIG.contracts.tokenContractId
      );
      
      // Get vault state
      console.log('🔍 Loading vault state in hashconnectdebug:');
      const vaultState = await vaultService.getVaultInfo(HEDERA_CONFIG.contracts.vaultContractId);
      console.log('✅ Vault state test successful:', vaultState);
      alert(`Vault state test successful! Check console for details.\nShareholders: ${vaultState.shareholderCount}/50`);
      
    } catch (error) {
      console.error('❌ Vault state test failed:', error);
      alert(`Vault state test failed: ${error.message}`);
    }
  };

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">🔍 HashConnect Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Connection State:</span>
            <Badge 
              variant={connectionState === 'Paired' ? 'default' : 'secondary'}
              className={connectionState === 'Paired' ? 'bg-green-500' : 'bg-red-500'}
            >
              {connectionState}
            </Badge>
          </div>
          <div>
            <span className="font-medium">User Connected:</span>
            <Badge 
              variant={user ? 'default' : 'secondary'}
              className={user ? 'bg-green-500' : 'bg-red-500'}
            >
              {user ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Wallet Type:</span>
            <span className="ml-2">{user?.walletType || 'None'}</span>
          </div>
          <div>
            <span className="font-medium">Account ID:</span>
            <span className="ml-2 font-mono text-xs">
              {user?.accountId || user?.walletAddress || 'None'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={checkHashConnectStatus} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            🔍 Check HashConnect Status
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={testGetClient} 
              variant="outline"
              size="sm"
            >
              Test getClient()
            </Button>
            <Button 
              onClick={testGetSigner} 
              variant="outline"
              size="sm"
            >
              Test getSigner()
            </Button>
          </div>
          
          <Button 
            onClick={testVaultState} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            🧪 Test Vault State
          </Button>
        </div>

        {debugInfo && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-sm mb-2">Debug Results:</h4>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HashConnectDebug; 