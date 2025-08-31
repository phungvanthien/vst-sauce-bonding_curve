import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import defaultManager, { HashConnectManager } from "@/lib/hashconnect";
import { HashConnectConnectionState, SessionData } from "hashconnect";

/**
 * HashConnect Context Interface
 * Provides access to HashConnect functionality and state throughout the app
 */
interface HashConnectContextType {
  manager: HashConnectManager;
  connectionState: HashConnectConnectionState;
  pairingData: SessionData | null;
  isConnecting: boolean;
  isAutoConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  autoConnect: () => Promise<void>;
}

const HashConnectContext = createContext<HashConnectContextType | null>(null);

interface HashConnectProviderProps {
  children: ReactNode;
}

/**
 * HashConnect Provider Component
 *
 * Manages HashConnect state and provides connection functionality to child components.
 * Handles:
 * - HashConnect manager lifecycle
 * - Connection state management
 * - Auto-connection on app startup
 * - Event handling for connection changes
 */
export function HashConnectProvider({ children }: HashConnectProviderProps) {
  // Use a global singleton manager so all parts of the app share the same HashConnect instance
  const managerRef = useRef<HashConnectManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = defaultManager;
  }
  const manager = managerRef.current;

  // Connection state management
  const [connectionState, setConnectionState] =
    useState<HashConnectConnectionState>(
      HashConnectConnectionState.Disconnected
    );
  const [pairingData, setPairingData] = useState<SessionData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false);

  /**
   * Sets up event listeners for HashConnect events
   * Syncs local state with HashConnect manager state
   */
  useEffect(() => {
    // Handle successful pairing with wallet
    const handlePairing = (newPairing: SessionData) => {
      setPairingData(newPairing);
      setConnectionState(HashConnectConnectionState.Paired);
    };

    // Handle wallet disconnection
    const handleDisconnection = () => {
      setPairingData(null);
      setConnectionState(HashConnectConnectionState.Disconnected);
    };

    // Handle connection status changes
    const handleConnectionStatusChange = (status: string) => {
      setConnectionState(status as HashConnectConnectionState);
    };

    // Subscribe to HashConnect events
    manager.on("pairing", handlePairing);
    manager.on("disconnection", handleDisconnection);
    manager.on("connectionStatusChange", handleConnectionStatusChange);

    // Sync initial state with manager
    const initialState = manager.getConnectionState();
    const initialPairingData = manager.getPairingData();
    setConnectionState(initialState);
    setPairingData(initialPairingData);

    // Cleanup event listeners on unmount
    return () => {
      manager.off("pairing", handlePairing);
      manager.off("disconnection", handleDisconnection);
      manager.off("connectionStatusChange", handleConnectionStatusChange);
    };
  }, [manager]);

  /**
   * Auto-connect on component mount
   * Attempts to restore previous wallet connections without user interaction
   */
  useEffect(() => {
    const attemptAutoConnect = async () => {
      // Only attempt auto-connect if we haven't tried yet and we're disconnected
      if (
        !hasAttemptedAutoConnect &&
        connectionState === HashConnectConnectionState.Disconnected
      ) {
        setHasAttemptedAutoConnect(true);
        setIsAutoConnecting(true);
        try {
          await manager.autoConnectHashConnect();
        } catch (error) {
          console.error("Auto-connect failed:", error);
        } finally {
          setIsAutoConnecting(false);
        }
      }
    };

    // Small delay to ensure everything is initialized
    const timer = setTimeout(attemptAutoConnect, 100);
    return () => clearTimeout(timer);
  }, [manager, connectionState, hasAttemptedAutoConnect]);

  /**
   * Manual connection function
   * Opens the HashPack pairing modal for user to connect wallet
   */
  const connect = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting || isAutoConnecting) {
      return;
    }

    setIsConnecting(true);
    try {
      await manager.initHashConnect();
    } catch (error) {
      console.error("❌ HashConnectContext: Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect function
   * Disconnects from HashPack and resets auto-connect flag
   */
  const disconnect = () => {
    manager.disconnect();
    // Reset auto-connect flag so it can try again after disconnect
    setHasAttemptedAutoConnect(false);
  };

  /**
   * Manual auto-connect function
   * Can be called to retry auto-connection
   */
  const autoConnect = async () => {
    // Prevent multiple simultaneous auto-connect attempts
    if (isConnecting || isAutoConnecting) {
      return;
    }

    setIsAutoConnecting(true);
    try {
      await manager.autoConnectHashConnect();
    } catch (error) {
      console.error("Auto-connect failed:", error);
    } finally {
      setIsAutoConnecting(false);
    }
  };

  // Context value object
  const value: HashConnectContextType = {
    manager,
    connectionState,
    pairingData,
    isConnecting,
    isAutoConnecting,
    connect,
    disconnect,
    autoConnect,
  };

  return (
    <HashConnectContext.Provider value={value}>
      {children}
    </HashConnectContext.Provider>
  );
}

/**
 * Hook to access HashConnect context
 * Must be used within a HashConnectProvider
 * @returns HashConnectContextType
 * @throws Error if used outside of HashConnectProvider
 */
export function useHashConnect() {
  const context = useContext(HashConnectContext);
  if (!context) {
    throw new Error("useHashConnect must be used within a HashConnectProvider");
  }
  return context;
}
