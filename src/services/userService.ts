import { WalletType } from "@/contexts/WalletContext";
import { joinUrl } from "@/utils/general-utils";

export interface CreateUserRequest {
  wallet_address: string;
  account_id?: string;
  wallet_type: WalletType;
  is_active?: boolean;
}

export interface CreateUserResponse {
  id: number;
  wallet_address: string;
  account_id?: string;
  wallet_type: WalletType;
  is_active: boolean;
  created_at: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

class UserService {
  private baseUrl: string;

  constructor() {
    // Use localhost for development testing
    this.baseUrl = "http://localhost:8000/api/v2_2";
  }

  /**
   * Create a new user in the system
   */
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      const url = joinUrl(this.baseUrl, '/subscription/users');
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      // Handle API response statuses
      if (data.status === 500) {
        throw new Error("Server error occurred while creating user");
      }

      // If no status field, user was created successfully
      if (!data.status) {
        return data;
      }

      // Handle other error statuses
      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("[userService] Error creating user:", error);
      throw error;
    }
  }

  /**
   * Get user by wallet address
   */
  async getUserByWalletAddress(walletAddress: string): Promise<CreateUserResponse | null> {
    try {
      const url = joinUrl(this.baseUrl, `/subscription/users/${encodeURIComponent(walletAddress)}`);
      const response = await fetch(url.toString(),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      // Handle API response statuses
      if (data.status === 500) {
        throw new Error("Server error occurred while fetching user");
      }

      if (data.status === 404) {
        return null; // User not found
      }

      // If no status field, user exists and data is valid
      if (!data.status) {
        return data;
      }

      // Handle other error statuses
      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("[userService] Error fetching user:", error);
      throw error;
    }
  }

  /**
   * Check if user exists, if not create them
   */
  async ensureUserExists(
    walletAddress: string,
    accountId: string | undefined,
    walletType: WalletType
  ): Promise<CreateUserResponse> {
    try {      
      // First, try to get existing user
      const existingUser = await this.getUserByWalletAddress(walletAddress);      
      if (existingUser) {
        return existingUser;
      }

      // User doesn't exist, create them
      const newUser = await this.createUser({
        wallet_address: walletAddress,
        account_id: accountId,
        wallet_type: walletType,
        is_active: true,
      });

      return newUser;
    } catch (error) {
      console.error("[userService] Error ensuring user exists:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const userService = new UserService();
