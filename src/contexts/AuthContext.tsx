import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";
import type { AuthState, User } from "../services/authService";

interface AuthContextType {
  authState: AuthState;
  connectWallet: () => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<User>;
  isMetaMaskAvailable: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(
    authService.getAuthState()
  );

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const connectWallet = async (): Promise<void> => {
    try {
      // Use simple wallet connection without signature for testing
      // Change to authenticateWithWallet() for production with full signature verification
      await authService.connectWalletOnly();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Failed to logout:", error);
      throw error;
    }
  };

  const getProfile = async (): Promise<User> => {
    try {
      return await authService.getProfile();
    } catch (error) {
      console.error("Failed to get profile:", error);
      throw error;
    }
  };

  const isMetaMaskAvailable = (): boolean => {
    return authService.isMetaMaskAvailable();
  };

  const value: AuthContextType = {
    authState,
    connectWallet,
    logout,
    getProfile,
    isMetaMaskAvailable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
