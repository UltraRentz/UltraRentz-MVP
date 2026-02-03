import { ethers } from "ethers";
import { authApi } from "./api";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface User {
  id: string;
  walletAddress: string;
  createdAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.initializeFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize auth state from localStorage
  private initializeFromStorage(): void {
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.authState = {
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
        };
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        this.clearAuth();
      }
    }
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Call immediately with current state
    listener(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.authState));
  }

  // Get current auth state
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Check if MetaMask is available
  public isMetaMaskAvailable(): boolean {
    return typeof window !== "undefined" && !!window.ethereum;
  }

  // Connect to MetaMask and get wallet address
  public async connectWallet(): Promise<string> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      return address;
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      throw new Error("Failed to connect to MetaMask. Please try again.");
    }
  }

  // Simple wallet connection without signature (for testing)
  public async connectWalletOnly(): Promise<void> {
    this.setLoading(true);

    try {
      console.log("Connecting to wallet only...");

      // Check if MetaMask is available
      if (!this.isMetaMaskAvailable()) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to continue."
        );
      }

      // Add timeout to wallet connection
      const connectWalletWithTimeout = async (): Promise<string> => {
        const connectPromise = this.connectWallet();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(new Error("Wallet connection timed out after 30 seconds")),
            30000
          );
        });

        return Promise.race([connectPromise, timeoutPromise]);
      };

      const address = await connectWalletWithTimeout();
      console.log("Wallet connected, address:", address);

      // Create a simple user object without backend verification
      const user = {
        id: `user_${Date.now()}`,
        walletAddress: address,
        createdAt: new Date().toISOString(),
      };

      // Create a simple token for testing (not JWT, just a demo token)
      const token = `demo_token_${Date.now()}_${address.slice(0, 8)}`;

      // Store auth data
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("authToken", token);

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        user,
        token,
        isLoading: false,
      };

      this.notifyListeners();
      console.log("Simple wallet connection successful!");
    } catch (error) {
      this.setLoading(false);
      console.error("Simple wallet connection error:", error);
      throw error;
    }
  }

  // Authenticate with wallet signature
  public async authenticateWithWallet(): Promise<void> {
    this.setLoading(true);

    try {
      console.log("Step 1: Connecting to wallet...");
      // Connect to wallet
      const address = await this.connectWallet();
      console.log("Step 1 complete: Wallet connected, address:", address);

      console.log("Step 2: Getting nonce from backend...");
      // Get nonce from backend
      const nonceResponse = await authApi.getNonce(address);
      const { message } = nonceResponse.data;
      console.log("Step 2 complete: Nonce received, message:", message);

      console.log("Step 3: Signing message with MetaMask...");
      // Sign message with MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Add timeout for signature request
      const signaturePromise = signer.signMessage(message);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error("Signature request timed out. Please try again.")),
          60000
        );
      });

      const signature = (await Promise.race([
        signaturePromise,
        timeoutPromise,
      ])) as string;
      console.log(
        "Step 3 complete: Message signed, signature:",
        signature.substring(0, 10) + "..."
      );

      console.log("Step 4: Verifying signature with backend...");
      // Verify signature with backend
      const verifyResponse = await authApi.verifySignature({
        address,
        signature,
        message,
      });

      const { token, user } = verifyResponse.data;
      console.log("Step 4 complete: Signature verified, token received");

      console.log("Step 5: Storing auth data...");
      // Store auth data
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("Step 6: Updating auth state...");
      // Update auth state
      this.authState = {
        isAuthenticated: true,
        user,
        token,
        isLoading: false,
      };

      this.notifyListeners();
      console.log("Step 6 complete: Authentication successful!");
    } catch (error: any) {
      this.setLoading(false);
      console.error("Authentication error:", error);

      // Provide more specific error messages
      if (error?.message?.includes("User rejected")) {
        throw new Error("Wallet connection was cancelled. Please try again.");
      } else if (error?.message?.includes("timeout")) {
        throw new Error(
          "Request timed out. Please make sure MetaMask is open and try again."
        );
      } else if (error?.message?.includes("Signature request timed out")) {
        throw new Error(
          "MetaMask signature request timed out. Please try again."
        );
      } else if (error?.message) {
        throw new Error(`Authentication failed: ${error.message}`);
      } else {
        throw new Error("Authentication failed. Please try again.");
      }
    }
  }

  // Get user profile from backend
  public async getProfile(): Promise<User> {
    try {
      const response = await authApi.getProfile();
      const user = response.data.user;

      // Update stored user data
      localStorage.setItem("user", JSON.stringify(user));
      this.authState.user = user;
      this.notifyListeners();

      return user;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  // Logout user
  public async logout(): Promise<void> {
    try {
      if (this.authState.token) {
        await authApi.logout();
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      this.clearAuth();
    }
  }

  // Clear authentication data
  private clearAuth(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    };
    this.notifyListeners();
  }

  // Set loading state
  private setLoading(isLoading: boolean): void {
    this.authState.isLoading = isLoading;
    this.notifyListeners();
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  // Get auth token
  public getToken(): string | null {
    return this.authState.token;
  }

  // Check if currently loading
  public isLoading(): boolean {
    return this.authState.isLoading;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
