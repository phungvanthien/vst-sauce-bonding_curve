import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHashConnect } from '@/contexts/HashConnectContext';
import { useAuth } from '@/contexts/AuthContext';

const HashConnectTest: React.FC = () => {
  const { connectionState, pairingData, connect } = useHashConnect();
  const { user } = useAuth();
  const [testResult, setTestResult] = React.useState<string>('');

  const testConnection = async () => {
    try {
      setTestResult('Testing connection...');
      
      // Test 1: Check context state
      console.log('🔍 Context State:', {
        connectionState,
        pairingData: pairingData ? 'Available' : 'None',
        user: user ? 'Connected' : 'None'
      });
      
      // Test 2: Check window.hashConnect
      const windowHashConnect = (window as any).hashConnect;
      console.log('🔍 Window HashConnect:', {
        exists: !!windowHashConnect,
        type: typeof windowHashConnect
      });
      
      // Test 3: Try to connect if not connected
      if (connectionState === 'Disconnected') {
        setTestResult('Attempting to connect...');
        await connect();
        setTestResult('Connection attempt completed. Check console for details.');
      } else {
        setTestResult('Already connected. Check console for details.');
      }
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setTestResult(`Test failed: ${error.message}`);
    }
  };

  const forceReconnect = async () => {
    try {
      setTestResult('Force reconnecting...');
      
      // Force a new connection
      await connect();
      setTestResult('Force reconnect completed. Check console for details.');
      
    } catch (error) {
      console.error('❌ Force reconnect failed:', error);
      setTestResult(`Force reconnect failed: ${error.message}`);
    }
  };

  return (
    <Card className="mt-4 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800">🔧 HashConnect Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Context State:</span>
            <Badge 
              variant={connectionState === 'Paired' ? 'default' : 'secondary'}
              className={connectionState === 'Paired' ? 'bg-green-500' : 'bg-red-500'}
            >
              {connectionState}
            </Badge>
          </div>
          <div>
            <span className="font-medium">User Auth:</span>
            <Badge 
              variant={user ? 'default' : 'secondary'}
              className={user ? 'bg-green-500' : 'bg-red-500'}
            >
              {user ? 'Connected' : 'None'}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Pairing Data:</span>
            <span className="ml-2">{pairingData ? 'Available' : 'None'}</span>
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
            onClick={testConnection} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            🔍 Test Connection
          </Button>
          
          <Button 
            onClick={forceReconnect} 
            variant="outline"
            size="sm"
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            🔄 Force Reconnect
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

export default HashConnectTest; 