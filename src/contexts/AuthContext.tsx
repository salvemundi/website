import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/msalConfig';
import * as authApi from '../lib/auth';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  entra_id?: string;
  fontys_email?: string;
  phone_number?: string;
  avatar?: string;  // Directus uses 'avatar' not 'picture'
  is_member: boolean;
  member_id?: number;
  membership_status?: 'active' | 'expired' | 'none';
  membership_expiry?: string; // ISO date string
  minecraft_username?: string;
}

// Initialize MSAL instance with error handling
let msalInstance: PublicClientApplication | null = null;
try {
  msalInstance = new PublicClientApplication(msalConfig);
} catch (error) {
  console.warn('⚠️ MSAL initialization failed. Microsoft login will be disabled.');
  console.warn('💡 Tip: MSAL requires HTTPS or "localhost" (not IP addresses like 192.168.x.x)');
  console.warn('   Please access the app via http://localhost:5175/ instead');
  console.error('Error details:', error);
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  signup: (userData: SignupData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (token) {
        try {
          const userData = await authApi.fetchUserDetails(token);
          setUser(userData);
        } catch (error) {
          // If token is expired, try to refresh
          if (refreshToken) {
            try {
              const response = await authApi.refreshAccessToken(refreshToken);
              localStorage.setItem('auth_token', response.access_token);
              localStorage.setItem('refresh_token', response.refresh_token);
              setUser(response.user);
            } catch (refreshError) {
              // Refresh failed, clear storage
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
            }
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.loginWithPassword(email, password);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMicrosoft = async () => {
    if (!msalInstance) {
      throw new Error('Microsoft login is not available. Please access the app via http://localhost (not an IP address) to enable Microsoft authentication.');
    }
    
    setIsLoading(true);
    try {
      // Initialize MSAL if needed
      await msalInstance.initialize();
      
      // Attempt silent login first
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }

      // Login with popup
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      
      if (loginResponse && loginResponse.account) {
        msalInstance.setActiveAccount(loginResponse.account);
        
        // Get the ID token to send to backend
        const idToken = loginResponse.idToken;
        const userEmail = loginResponse.account.username;
        
        // Authenticate with backend using Entra ID token
        const response = await authApi.loginWithEntraId(idToken, userEmail);
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        setUser(response.user);
      }
    } catch (error) {
      console.error('Microsoft login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    setIsLoading(true);
    try {
      const response = await authApi.signupWithPassword(userData);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      setUser(response.user);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.error('Failed to logout from Directus:', error);
      }
    }
    
    // Only clear local session, don't logout from Microsoft
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const userData = await authApi.fetchUserDetails(token);
        setUser(userData);
      } catch (error) {
        console.error('Failed to refresh user:', error);
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithMicrosoft,
        logout,
        signup,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
