// TypeScript interfaces for HashConnect
import { HashConnect, HashConnectConnectionState, SessionData } from "hashconnect";
import { LedgerId } from "@hashgraph/sdk";
import { VAULTS_CONFIG } from "@/config/hederaConfig";

// App metadata for HashPack wallet connection
const metadata = {
  name: "Vistia TA Dashboard",
  description: "AI-Powered Trading Platform",
  icons: [`https://gist.githubusercontent.com/nguyenPhuocLoc99/d7309d2c19cc0351bc32a72d7dabb13d/raw/84a4a80d8dd6de140a8fbae80f6cd3e403930929/icon.svg`],
  url: typeof window !== 'undefined' ? window.location.origin : "http://localhost:5173"
};

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
  private instance: HashConnect | null = null;
  private connectionState: HashConnectConnectionState = HashConnectConnectionState.Disconnected;
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
      this.connectionState = HashConnectConnectionState.Paired;
      this.emit('pairing', newPairing);
    });

    // Handle wallet disconnection
    this.instance.disconnectionEvent.on(() => {
      this.pairingData = null;
      this.connectionState = HashConnectConnectionState.Disconnected;
      this.emit('disconnection');
    });

    // Handle connection status changes
    this.instance.connectionStatusChangeEvent.on((connectionStatus: string) => {
      this.connectionState = connectionStatus as HashConnectConnectionState;
      this.emit('connectionStatusChange', connectionStatus);
      
      // If we're connected but not paired, check if we have pairing data
      if (connectionStatus === HashConnectConnectionState.Connected && !this.pairingData) {
        // Waiting for user approval in wallet
      }
      
      // If we're connected and have pairing data, we should be paired
      if (connectionStatus === HashConnectConnectionState.Connected && this.pairingData) {
        this.connectionState = HashConnectConnectionState.Paired;
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
   * @param event - Event name to listen for
   * @param callback - Function to call when event occurs
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
   * @param callback - Function to remove from listeners
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
   * @returns Promise<HashConnect instance>
   */
  async ensureHashConnectInitialized(): Promise<HashConnect> {
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
      // Use a default project ID for development
      // Note: You need to get a real Project ID from https://www.hashpack.app/
      const projectId = import.meta.env.VITE_HASHCONNECT_PROJECT_ID || "demo-app-v1";



      // Create the hashconnect instance for this user
      this.instance = new HashConnect(
        LedgerId.MAINNET,
        projectId,
        metadata,
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
   */
  async initHashConnect(): Promise<void> {
    const instance = await this.ensureHashConnectInitialized();
    
    // Check if we're already paired before opening the modal
    if (this.connectionState === HashConnectConnectionState.Paired && this.pairingData) {
      return;
    }
    
    // Open pairing modal for user to connect
    instance.openPairingModal();
  }

  /**
   * Attempts to auto-connect using previously stored pairing data
   * This is called on app startup to restore previous connections
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
   * @throws Error if HashConnect is not available
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
   * Gets a signer for a specific account (or the paired account by default)
   * @param accountId - Optional Hedera account ID. If omitted, uses the first paired account.
   * @returns Signer instance for the account
   */
  getSigner(accountId?: string): any {
    this.checkHashConnect();
    const resolvedAccountId = accountId || this.pairingData?.accountIds?.[0];
    if (!resolvedAccountId) {
      throw new Error("No paired account found. Please connect your wallet first.");
    }
    // Use type assertion to resolve SDK version compatibility
    return this.instance!.getSigner(resolvedAccountId as any);
  }

  /**
   * Sends a transaction to the network
   * @param accountId - The account ID to sign with
   * @param transaction - The transaction to send
   * @returns Promise with transaction result
   */
  async sendTransaction(accountId: any, transaction: any): Promise<any> {
    this.checkHashConnect();
    return await this.instance!.sendTransaction(accountId, transaction);
  }

  /**
   * Signs a transaction and returns it without sending
   * @param accountId - The account ID to sign with
   * @param transaction - The transaction to sign
   * @returns Promise with signed transaction
   */
  async signAndReturnTransaction(accountId: any, transaction: any): Promise<any> {
    this.checkHashConnect();
    return await this.instance!.signAndReturnTransaction(accountId, transaction);
  }

  /**
   * Signs a message with the specified account
   * @param accountId - The account ID to sign with
   * @param message - The message to sign
   * @returns Promise with signature
   */
  async signMessage(accountId: any, message: string): Promise<any> {
    this.checkHashConnect();
    return await this.instance!.signMessages(accountId, message);
  }

  /**
   * Executes a transaction via HashConnect (signs and sends)
   * @param transaction - The transaction to execute
   * @param accountId - Optional account ID, uses first paired account if omitted
   * @returns Promise with transaction result
   */
  async executeTransaction(transaction: any, accountId?: string): Promise<any> {
    this.checkHashConnect();
    
    const resolvedAccountId = accountId || this.pairingData?.accountIds?.[0];
    if (!resolvedAccountId) {
      throw new Error("No paired account found. Please connect your wallet first.");
    }

    try {
      // Send transaction via HashConnect
      // Use type assertion to resolve SDK version compatibility
      const result = await this.instance!.sendTransaction(resolvedAccountId as any, transaction);
      
      return result;
      
    } catch (error) {
      console.error('❌ HashConnect transaction failed:', error);
      throw error;
    }
  }

  /**
   * Verifies a message signature
   * @param message - The original message
   * @param signature - The signature to verify
   * @param publicKey - The public key to verify against
   * @returns Boolean indicating if signature is valid
   */
  verifyMessageSignature(message: string, signature: any, publicKey: any): boolean {
    this.checkHashConnect();
    return this.instance!.verifyMessageSignature(message, signature, publicKey);
  }

  /**
   * Disconnects from HashPack and clears local state
   */
  disconnect(): void {
    if (this.instance) {
      this.instance.disconnect();
    }
    
    // Clear local state for this user
    this.connectionState = HashConnectConnectionState.Disconnected;
    this.pairingData = null;
  }

  /**
   * Gets the current connection state
   * @returns Current connection state
   */
  getConnectionState(): HashConnectConnectionState {
    return this.connectionState;
  }

  /**
   * Convenience: whether we are paired/connected to a wallet
   */
  isConnected(): boolean {
    return this.connectionState === HashConnectConnectionState.Paired;
  }

  /**
   * Gets the current pairing data
   * @returns Pairing data object or null
   */
  getPairingData(): SessionData | null {
    return this.pairingData;
  }
} 

// Export singletons so services and contexts can share the same connection state
export const globalHashConnectManager = new HashConnectManager();
export const hashConnectManager = globalHashConnectManager;
export default hashConnectManager;