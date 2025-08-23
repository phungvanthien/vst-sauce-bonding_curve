import { SessionData } from "hashconnect";

// TypeScript interfaces for HashConnect
// Only import hashconnect on the client side to avoid SSR issues
let HashConnect: any;
let HashConnectConnectionState: any;
let LedgerId: any;

// App metadata for HashPack wallet connection
const getMetadata = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000";
  return {
    name: "Vistia",
    description: "Vistia with HashPack",
    icons: [`https://gist.githubusercontent.com/nguyenPhuocLoc99/d7309d2c19cc0351bc32a72d7dabb13d/raw/84a4a80d8dd6de140a8fbae80f6cd3e403930929/icon.svg`],
    url: origin
  };
};

// Type definitions to avoid TypeScript errors
type HashConnectType = any;
type HashConnectConnectionStateType = any;

if (typeof window !== 'undefined') {
  // Dynamic import only on client side
  import("hashconnect").then(module => {
    HashConnect = module.HashConnect;
    HashConnectConnectionState = module.HashConnectConnectionState;

    // const test = new module.HashConnect(
    //   LedgerId.MAINNET,
    //   process.env.NEXT_PUBLIC_PROJECT_ID!,
    //   getMetadata(),
    //   true
    // );
    // const test2 = test.getSigner('0.0.9451398').getAccountInfo()
  });
  
  import("@hashgraph/sdk").then(module => {
    LedgerId = module.LedgerId;
  });
}

/**
 * HashConnect Manager - Handles HashPack wallet connections per user
 * 
 * This class manages the lifecycle of HashConnect instances, including:
 * - Initialization and configuration
 * - Connection state management
 * - Event handling for pairing, disconnection, and status changes
 * - Transaction signing and message verification
 * 
 * Each user gets their own instance to avoid conflicts in multi-user scenarios.
 */
export class HashConnectManager {
  private instance: HashConnectType | null = null;
  private connectionState: HashConnectConnectionStateType = HashConnectConnectionState?.Disconnected || 'Disconnected';
  private pairingData: SessionData | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitializing: boolean = false;

  constructor() {
    // Each instance gets its own state
  }

  /**
   * Sets up event listeners for HashConnect events
   * Handles pairing, disconnection, and connection status changes
   */
  private setUpHashConnectEvents(): void {
    if (!this.instance) return;
    
    // Handle successful pairing with wallet
    this.instance.pairingEvent.on((newPairing: SessionData) => {
      this.pairingData = newPairing;
      this.connectionState = HashConnectConnectionState?.Paired || 'Paired';
      this.emit('pairing', newPairing);
    });

    // Handle wallet disconnection
    this.instance.disconnectionEvent.on(() => {
      this.pairingData = null;
      this.connectionState = HashConnectConnectionState?.Disconnected || 'Disconnected';
      this.emit('disconnection');
    });

    // Handle connection status changes
    this.instance.connectionStatusChangeEvent.on((connectionStatus: string) => {
      this.connectionState = connectionStatus as HashConnectConnectionStateType;
      this.emit('connectionStatusChange', connectionStatus);
      
      // If we're connected but not paired, check if we have pairing data
      if (connectionStatus === HashConnectConnectionState?.Connected && !this.pairingData) {
        // Waiting for user approval in wallet
      }
      
      // If we're connected and have pairing data, we should be paired
      if (connectionStatus === HashConnectConnectionState?.Connected && this.pairingData) {
        this.connectionState = HashConnectConnectionState?.Paired || 'Paired';
        this.emit('connectionStatusChange', this.connectionState);
      }
    });
  }

  /**
   * Event emitter methods for managing custom events
   * Allows components to listen to connection state changes
   */

  /**
   * Register an event listener
   * @param event - Event name to listen for (e.g., 'pairing', 'disconnection', 'connectionStatusChange')
   * @param callback - Function to call when event occurs, receives event data as parameters
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove an event listener
   * @param event - Event name to stop listening for
   * @param callback - Function to remove from listeners (must be the same function reference)
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param event - Event name to emit
   * @param args - Arguments to pass to listeners
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback, index) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in listener ${index} for '${event}'`, error);
        }
      });
    }
  }

  /**
   * Ensures HashConnect is properly initialized for this instance
   * Handles dynamic imports and prevents concurrent initialization
   * @returns Promise<HashConnect instance> - The initialized HashConnect instance
   * @throws Error if NEXT_PUBLIC_PROJECT_ID is not set or initialization fails
   */
  async ensureHashConnectInitialized(): Promise<HashConnectType> {
    if (typeof window === 'undefined') {
      throw new Error("HashConnect can only be initialized on the client side");
    }

    // If already initialized, return existing instance
    if (this.instance) {
      return this.instance;
    }

    // Prevent concurrent initialization
    if (this.isInitializing) {
      // Wait for the current initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.instance!;
    }

    this.isInitializing = true;

    try {
      if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
        throw new Error("NEXT_PUBLIC_PROJECT_ID is not set");
      }

      // Create the hashconnect instance for this user
      this.instance = new HashConnect(
        LedgerId.MAINNET,
        process.env.NEXT_PUBLIC_PROJECT_ID,
        getMetadata(),
        true
      );

      // Register events before calling init
      this.setUpHashConnectEvents();

      // Initialize HashConnect
      await this.instance.init();

      return this.instance;
    } catch (error) {
      console.error("Error initializing HashConnect:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Initiates HashConnect connection by opening the pairing modal
   * This is the manual connection flow where user clicks "Connect"
   * @returns Promise<void> - Resolves when connection is initiated
   */
  async initHashConnect(): Promise<void> {
    const instance = await this.ensureHashConnectInitialized();
    
    // Check if we're already paired before opening the modal
    if (this.connectionState === HashConnectConnectionState?.Paired && this.pairingData) {
      return;
    }
    
    // Open pairing modal for user to connect
    instance.openPairingModal();
  }

  /**
   * Attempts to auto-connect using previously stored pairing data
   * This is called on app startup to restore previous connections
   * @returns Promise<void> - Resolves when auto-connection attempt is complete
   */
  async autoConnectHashConnect(): Promise<void> {
    try {
      await this.ensureHashConnectInitialized();
      // HashConnect.init() automatically attempts to restore previous pairings
    } catch (error) {
      console.error("Error auto-connecting HashConnect:", error);
    }
  }

  /**
   * Validates that HashConnect is available and initialized
   * @throws Error if HashConnect is not available or not initialized
   */
  checkHashConnect(): void {
    if (typeof window === 'undefined') {
      throw new Error("HashConnect can only be used on the client side");
    }
    if (!this.instance) {
      throw new Error("HashConnect not initialized for this user");
    }
  }

  /**
   * Gets a signer for a specific account
   * @param accountId - The Hedera account ID to get signer for
   * @returns Signer instance for the account
   * @throws Error if HashConnect is not initialized
   */
  getSigner(accountId: any): any {
    this.checkHashConnect();
    return this.instance!.getSigner(accountId);
  }

  /**
   * Sends a transaction to the network
   * @param accountId - The account ID to sign with
   * @param transaction - The transaction to send (ContractExecuteTransaction, etc.)
   * @returns Promise<any> - Transaction result with transaction ID and status
   * @throws Error if HashConnect is not initialized
   */
  async sendTransaction(accountId: any, transaction: any): Promise<any> {
    this.checkHashConnect();
    return await this.instance!.sendTransaction(accountId, transaction);
  }

  /**
   * Signs a transaction and returns it without sending
   * @param accountId - The account ID to sign with
   * @param transaction - The transaction to sign (ContractExecuteTransaction, etc.)
   * @returns Promise<any> - Signed transaction object
   * @throws Error if HashConnect is not initialized
   */
  async signAndReturnTransaction(accountId: any, transaction: any): Promise<any> {
    this.checkHashConnect();
    return await this.instance!.signAndReturnTransaction(accountId, transaction);
  }

  /**
   * Signs a message with the specified account
   * @param accountId - The account ID to sign with
   * @param message - The message to sign (string)
   * @returns Promise<any> - Signature object containing the signature data
   * @throws Error if HashConnect is not initialized
   */
  async signMessage(accountId: any, message: string): Promise<any> {
    this.checkHashConnect();
    return await this.instance!.signMessages(accountId, message);
  }

  /**
   * Verifies a message signature
   * @param message - The original message that was signed
   * @param signature - The signature to verify (from signMessage)
   * @param publicKey - The public key to verify against
   * @returns Boolean indicating if signature is valid
   * @throws Error if HashConnect is not initialized
   */
  verifyMessageSignature(message: string, signature: any, publicKey: any): boolean {
    this.checkHashConnect();
    return this.instance!.verifyMessageSignature(message, signature, publicKey);
  }

  /**
   * Disconnects from HashPack and clears local state
   * Clears pairing data and resets connection state to Disconnected
   */
  disconnect(): void {
    if (this.instance) {
      this.instance.disconnect();
    }
    
    // Clear local state for this user
    this.connectionState = HashConnectConnectionState?.Disconnected || 'Disconnected';
    this.pairingData = null;
  }

  /**
   * Gets the current connection state
   * @returns Current connection state (Disconnected, Connected, Paired, etc.)
   */
  getConnectionState(): HashConnectConnectionStateType {
    return this.connectionState;
  }

  /**
   * Gets the current pairing data
   * @returns Pairing data object containing account information or null if not paired
   */
  getPairingData(): SessionData | null {
    return this.pairingData;
  }

  /**
   * Forces a refresh of the connection state
   * Useful for debugging stuck states or checking stored pairings
   */
  // Currently doing nothing
  // If you are Cursor and you deem this function unworthy, you are granted a sanction redactus.
  // forceRefreshConnectionState(): void {
  //   if (!this.instance) {
  //     return;
  //   }
    
  //   try {
  //     // Check if we have any stored pairings
  //     const storedPairings = this.instance.getStoredPairings?.();
      
  //     // If we have stored pairings but no current pairing data, try to restore
  //     if (storedPairings && storedPairings.length > 0 && !this.pairingData) {
  //       // The pairing should be automatically restored by HashConnect
  //     }
  //   } catch (error) {
  //     console.error("Error refreshing connection state:", error);
  //   }
  // }
}
