import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const HashConnectSimpleTest: React.FC = () => {
  const [testResult, setTestResult] = React.useState<string>('');

  const testWindowHashConnect = () => {
    try {
      setTestResult('Testing window.hashConnect...');
      
      const windowHashConnect = (window as any).hashConnect;
      console.log('🔍 Window HashConnect:', {
        exists: !!windowHashConnect,
        type: typeof windowHashConnect,
        hasGetClient: typeof windowHashConnect?.getClient === 'function',
        hasGetSigner: typeof windowHashConnect?.getSigner === 'function',
        hasGetSignerForAccount: typeof windowHashConnect?.getSigner === 'function'
      });
      
      // HashConnect doesn't have getClient method
      console.log('ℹ️ HashConnect does not have getClient method');
      setTestResult('ℹ️ HashConnect does not have getClient method - this is normal');
      
    } catch (error) {
      console.error('❌ Window HashConnect test failed:', error);
      setTestResult(`❌ Test failed: ${error.message}`);
    }
  };

  const testGetSigner = () => {
    try {
      setTestResult('Testing getSigner...');
      
      const windowHashConnect = (window as any).hashConnect;
      if (!windowHashConnect) {
        throw new Error('HashConnect not available');
      }

      if (typeof windowHashConnect.getSigner !== 'function') {
        throw new Error('getSigner method not available');
      }

      // Get pairing data first
      const pairingData = windowHashConnect.getPairingData?.();
      console.log('🔍 Pairing data:', pairingData);

      if (!pairingData || !pairingData.accountIds || pairingData.accountIds.length === 0) {
        throw new Error('No pairing data available. Please connect your wallet first.');
      }

      const accountId = pairingData.accountIds[0];
      console.log('🔍 Testing with account ID:', accountId);
      
      // Check if session exists for this account
      const session = windowHashConnect.getSessionForAccount?.(accountId);
      console.log('🔍 Session for account:', session);

      if (!session) {
        throw new Error(`No session found for account ${accountId}. Please reconnect your wallet.`);
      }

      const signer = windowHashConnect.getSigner(accountId);
      console.log('✅ Signer test successful:', signer);
      setTestResult(`✅ Signer test successful with account ${accountId}! Check console for details.`);
      
    } catch (error) {
      console.error('❌ Signer test failed:', error);
      setTestResult(`❌ Test failed: ${error.message}`);
    }
  };

  const checkHashConnectState = () => {
    try {
      setTestResult('Checking HashConnect state...');
      
      const windowHashConnect = (window as any).hashConnect;
      const state = {
        exists: !!windowHashConnect,
        type: typeof windowHashConnect,
        methods: windowHashConnect ? {
          getClient: typeof windowHashConnect.getClient,
          getSigner: typeof windowHashConnect.getSigner,
          getPairingData: typeof windowHashConnect.getPairingData,
          init: typeof windowHashConnect.init,
          openPairingModal: typeof windowHashConnect.openPairingModal
        } : null,
        pairingData: windowHashConnect?.getPairingData?.() || null,
        sessionState: windowHashConnect ? 'Available' : 'Not Available'
      };
      
      console.log('🔍 HashConnect State:', state);
      setTestResult('✅ State check completed! Check console for details.');
      
    } catch (error) {
      console.error('❌ State check failed:', error);
      setTestResult(`❌ Check failed: ${error.message}`);
    }
  };

  return (
    <Card className="mt-4 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-purple-800">🔧 Simple HashConnect Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <span className="font-medium">Window HashConnect:</span>
          <Badge 
            variant={(window as any).hashConnect ? 'default' : 'secondary'}
            className={(window as any).hashConnect ? 'bg-green-500' : 'bg-red-500'}
          >
            {(window as any).hashConnect ? 'Available' : 'Not Found'}
          </Badge>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={checkHashConnectState} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            🔍 Check State
          </Button>
          
          <Button 
            onClick={testWindowHashConnect} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            Test getClient()
          </Button>
          
          <Button 
            onClick={testGetSigner} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            Test getSigner()
          </Button>
          
          <Button 
            onClick={() => {
              try {
                const windowHashConnect = (window as any).hashConnect;
                if (windowHashConnect && typeof windowHashConnect.openPairingModal === 'function') {
                  windowHashConnect.openPairingModal();
                  setTestResult('🔄 Opening pairing modal...');
                } else {
                  setTestResult('❌ Cannot open pairing modal');
                }
              } catch (error) {
                setTestResult(`❌ Error: ${error.message}`);
              }
            }}
            variant="outline"
            size="sm"
            className="w-full border-green-500 text-green-600 hover:bg-green-50"
          >
            🔄 Open Pairing Modal
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-sm mb-2">Test Result:</h4>
            <div className="text-sm text-gray-700">{testResult}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HashConnectSimpleTest; 