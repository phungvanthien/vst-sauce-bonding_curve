import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHashConnect } from '@/contexts/HashConnectContext';

export default function SessionDebug() {
  const { manager, connectionState, pairingData, connect, disconnect } = useHashConnect();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    updateDebugInfo();
  }, [connectionState, pairingData]);

  const updateDebugInfo = () => {
    const info = {
      connectionState,
      pairingData,
      hasManager: !!manager,
      managerMethods: manager ? {
        getConnectionState: typeof manager.getConnectionState,
        getPairingData: typeof manager.getPairingData,
        isConnected: typeof manager.isConnected,
        getSigner: typeof manager.getSigner,
        getSignerForAccount: typeof manager.getSignerForAccount
      } : null,
      windowHashConnect: {
        exists: !!(window as any).hashConnect,
        type: typeof (window as any).hashConnect,
        hasGetSigner: typeof (window as any).hashConnect?.getSigner === 'function',
        hasGetPairingData: typeof (window as any).hashConnect?.getPairingData === 'function'
      }
    };
    setDebugInfo(info);
  };

  const testGetSigner = async () => {
    try {
      setTestResult('Testing getSigner...');
      
      if (!manager) {
        throw new Error('Manager not available');
      }

      const signer = await manager.getSigner();
      console.log('✅ Signer test successful:', signer);
      setTestResult('✅ Signer test successful! Check console for details.');
    } catch (error) {
      console.error('❌ Signer test failed:', error);
      setTestResult(`❌ Test failed: ${error.message}`);
    }
  };

  const testGetSignerForAccount = async () => {
    try {
      setTestResult('Testing getSignerForAccount...');
      
      if (!manager || !pairingData?.accountIds?.[0]) {
        throw new Error('Manager or account ID not available');
      }

      const accountId = pairingData.accountIds[0];
      const signer = manager.getSignerForAccount(accountId);
      console.log('✅ getSignerForAccount test successful:', signer);
      setTestResult(`✅ getSignerForAccount test successful with account ${accountId}!`);
    } catch (error) {
      console.error('❌ getSignerForAccount test failed:', error);
      setTestResult(`❌ Test failed: ${error.message}`);
    }
  };

  const forceReconnect = async () => {
    try {
      setTestResult('Force reconnecting...');
      disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await connect();
      setTestResult('✅ Force reconnect completed');
    } catch (error) {
      console.error('❌ Force reconnect failed:', error);
      setTestResult(`❌ Force reconnect failed: ${error.message}`);
    }
  };

  const clearAllData = () => {
    try {
      setTestResult('Clearing all HashConnect data...');
      manager.clearAllData();
      setTestResult('✅ All data cleared! Refresh page to restart.');
    } catch (error) {
      console.error('❌ Clear data failed:', error);
      setTestResult(`❌ Clear data failed: ${error.message}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🔍 Session Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <h3 className="font-semibold">Connection Status</h3>
          <div className="text-sm space-y-1">
            <div>State: <span className={`font-mono ${connectionState === 'Paired' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionState}
            </span></div>
            <div>Has Pairing Data: <span className={`font-mono ${pairingData ? 'text-green-600' : 'text-red-600'}`}>
              {pairingData ? 'Yes' : 'No'}
            </span></div>
            {pairingData && (
              <div>Account IDs: <span className="font-mono text-blue-600">
                {pairingData.accountIds?.join(', ') || 'None'}
              </span></div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="space-y-2">
          <h3 className="font-semibold">Debug Info</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Results</h3>
          <div className="text-sm p-2 bg-gray-50 rounded">
            {testResult || 'No tests run yet'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <h3 className="font-semibold">Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={testGetSigner} 
              variant="outline"
              size="sm"
              disabled={connectionState !== 'Paired'}
            >
              Test getSigner()
            </Button>
            
            <Button 
              onClick={testGetSignerForAccount} 
              variant="outline"
              size="sm"
              disabled={!pairingData?.accountIds?.[0]}
            >
              Test getSignerForAccount()
            </Button>
            
            <Button 
              onClick={forceReconnect} 
              variant="outline"
              size="sm"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              🔄 Force Reconnect
            </Button>
            
            <Button 
              onClick={updateDebugInfo} 
              variant="outline"
              size="sm"
            >
              🔄 Refresh Debug Info
            </Button>
            
            <Button 
              onClick={clearAllData} 
              variant="outline"
              size="sm"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              🧹 Clear All Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 