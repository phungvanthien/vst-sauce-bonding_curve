import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DebugInfo {
  hashConnectAvailable: boolean;
  hashPackAvailable: boolean;
  projectId: string;
  localStorageData: boolean;
  connectionState: string;
  errors: string[];
}

export function HashConnectDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    hashConnectAvailable: false,
    hashPackAvailable: false,
    projectId: "unknown",
    localStorageData: false,
    connectionState: "unknown",
    errors: []
  });

  const [isVisible, setIsVisible] = useState(false);

  const checkDebugInfo = () => {
    const errors: string[] = [];
    
    try {
      // Check HashConnect availability
      const hashConnectAvailable = typeof window !== 'undefined' && 
        typeof (window as any).hashconnect !== 'undefined';
      
      // Check HashPack extension
      const hashPackAvailable = typeof window !== 'undefined' && 
        typeof (window as any).hashpack !== 'undefined';
      
      // Check project ID
      const projectId = import.meta.env.VITE_HASHCONNECT_PROJECT_ID || "NOT SET";
      
      // Check localStorage data
      const localStorageData = typeof window !== 'undefined' && 
        localStorage.getItem('hashconnect') !== null;
      
      // Check connection state (if available)
      let connectionState = "unknown";
      try {
        if (typeof window !== 'undefined' && (window as any).hashconnect) {
          connectionState = (window as any).hashconnect.connectionState || "unknown";
        }
      } catch (error) {
        errors.push(`Connection state error: ${error.message}`);
      }
      
      setDebugInfo({
        hashConnectAvailable,
        hashPackAvailable,
        projectId,
        localStorageData,
        connectionState,
        errors
      });
      
    } catch (error) {
      errors.push(`Debug check error: ${error.message}`);
      setDebugInfo(prev => ({ ...prev, errors }));
    }
  };

  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      checkDebugInfo();
    }
  };

  useEffect(() => {
    checkDebugInfo();
  }, []);

  if (!isVisible) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsVisible(true)}
        className="mt-4"
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Show Debug Info
      </Button>
    );
  }

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
            HashConnect Debug Info
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={checkDebugInfo}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
              Hide
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">HashConnect Library:</span>
            <Badge variant={debugInfo.hashConnectAvailable ? "default" : "destructive"}>
              {debugInfo.hashConnectAvailable ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Available</>
              ) : (
                <><XCircle className="w-3 h-3 mr-1" /> Not Available</>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">HashPack Extension:</span>
            <Badge variant={debugInfo.hashPackAvailable ? "default" : "destructive"}>
              {debugInfo.hashPackAvailable ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Installed</>
              ) : (
                <><XCircle className="w-3 h-3 mr-1" /> Not Installed</>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Project ID:</span>
            <Badge variant={debugInfo.projectId !== "NOT SET" ? "default" : "destructive"}>
              {debugInfo.projectId !== "NOT SET" ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Set</>
              ) : (
                <><XCircle className="w-3 h-3 mr-1" /> Not Set</>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">LocalStorage Data:</span>
            <Badge variant={debugInfo.localStorageData ? "default" : "secondary"}>
              {debugInfo.localStorageData ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Found</>
              ) : (
                <><AlertCircle className="w-3 h-3 mr-1" /> Empty</>
              )}
            </Badge>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Connection State:</span>
            <Badge variant="outline">{debugInfo.connectionState}</Badge>
          </div>
          
          <div className="text-xs text-gray-600">
            <strong>Project ID:</strong> {debugInfo.projectId}
          </div>
        </div>
        
        {debugInfo.errors.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-red-600 mb-2">Errors:</div>
            <div className="space-y-1">
              {debugInfo.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" onClick={clearStorage} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Storage & Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
