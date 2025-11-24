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
  console.warn('💡 Tip: MSAL requires HTTPS or "localhost" (not IP addresses like 192.168.x.x).');
  console.warn('   Over LAN, expose the dev server over HTTPS and set VITE_AUTH_REDIRECT_URI to that HTTPS origin, also adding it in the Entra app.');
  console.error('Error details:', error);
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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

    // Listen for external auth expiration events
    const onAuthExpired = () => {
      // Clear stored tokens and update state
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      } catch (e) {
        // ignore
      }
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth:expired', onAuthExpired as EventListener);
    return () => {
      window.removeEventListener('auth:expired', onAuthExpired as EventListener);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (token) {
        try {
          const userData = await authApi.fetchUserDetails(token);
          if (userData) {
            setUser(userData);
          } else {
            // Token was invalid/expired and was cleared by fetchUserDetails
            // Try refresh if we still have a refresh token
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
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } catch (error) {
          // An unexpected error occurred while fetching details
          console.error('Auth check failed (fetch user):', error);
          // Attempt refresh flow
          if (refreshToken) {
            try {
              const response = await authApi.refreshAccessToken(refreshToken);
              localStorage.setItem('auth_token', response.access_token);
              localStorage.setItem('refresh_token', response.refresh_token);
              setUser(response.user);
            } catch (refreshError) {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              setUser(null);
            }
          } else {
            localStorage.removeItem('auth_token');
            setUser(null);
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

  const loginWithMicrosoft = async () => {
    if (!msalInstance) {
      throw new Error('Microsoft login is not available. Use HTTPS with a redirect URI that matches your Entra app (set VITE_AUTH_REDIRECT_URI for LAN/IP testing).');
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
        // Store tokens first so helper functions (getImageUrl) can build
        // authenticated asset URLs immediately.
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);

        // Set the user from the response payload immediately to update UI,
        // but then try to fetch an up-to-date user record from Directus
        // using the stored token. This helps ensure fields like `avatar`
        // (which may be omitted from the initial response) are available
        // without requiring a full page refresh.
        setUser(response.user);

        try {
          const refreshed = await authApi.fetchUserDetails(response.access_token);
          if (refreshed) {
            setUser(refreshed);
          }
        } catch (e) {
          // Non-fatal: keep the initial user payload if fetching fails.
          console.warn('Could not fetch fresh user details right after login:', e);
        }
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
