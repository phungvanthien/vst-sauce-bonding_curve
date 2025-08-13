import defaultManager, { HashConnectManager } from '@/lib/hashconnect';

class HashConnectService {
  private static instance: HashConnectService;
  private manager: HashConnectManager | null = null;

  private constructor() {}

  static getInstance(): HashConnectService {
    if (!HashConnectService.instance) {
      HashConnectService.instance = new HashConnectService();
    }
    return HashConnectService.instance;
  }

  async getManager(): Promise<HashConnectManager> {
    if (!this.manager) {
      // Use the shared singleton so connection state is consistent across app
      this.manager = defaultManager;
      await this.manager.ensureHashConnectInitialized();
    }
    return this.manager;
  }

  async getClient(): Promise<unknown> {
    const manager = await this.getManager();
    if (!manager.isConnected()) {
      throw new Error('HashConnect not connected. Please connect your wallet first.');
    }
    return await manager.getClient();
  }

  async getSigner(): Promise<unknown> {
    const manager = await this.getManager();
    if (!manager.isConnected()) {
      throw new Error('HashConnect not connected. Please connect your wallet first.');
    }
    // Use default paired account if none is specified
    try {
      return await manager.getSigner();
    } catch (error: unknown) {
      const message = String(error?.message || error);
      if (message.includes('Signer could not find session')) {
        // Prompt user to pair again
        try { 
          await manager.initHashConnect(); 
        } catch (error) {
          console.log('HashConnect init error:', error);
        }
        throw new Error('HashConnect not connected. Please connect your wallet first and try again.');
      }
      throw error;
    }
  }

  async requestPairing(): Promise<void> {
    const manager = await this.getManager();
    await manager.initHashConnect();
  }

  getPairingData() {
    return this.manager?.getPairingData() || null;
  }

  async isConnected(): Promise<boolean> {
    try {
      const manager = await this.getManager();
      return manager.isConnected();
    } catch (error) {
      return false;
    }
  }

  getConnectionState(): string {
    if (!this.manager) {
      return 'Disconnected';
    }
    return this.manager.getConnectionState();
  }
}

export const hashConnectService = HashConnectService.getInstance(); 