'use client';
import { createContext } from 'react';

// MISSING SOURCE REQUIREMENT: Stubbed to satisfy compiler
type AuthUser = {
    membership_status?: string | null;
};

type AuthContextValue = {
    isAuthenticated: boolean;
    user: AuthUser | null;
    loginWithMicrosoft: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
    return {
        isAuthenticated: false as boolean,
        user: null as AuthUser | null,
        loginWithMicrosoft: () => {
            console.log('Login triggered. Missing exact source.');
        }
    } satisfies AuthContextValue;
}
