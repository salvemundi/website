'use client';

import { useState, useCallback } from 'react';
import { User } from '@/shared/model/types/auth';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import * as authApi from '@/shared/lib/auth';

interface UseSessionResult {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    fetchSession: () => Promise<User | null>;
    clearSession: () => void;
}

export function useSession(): UseSessionResult {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSession = useCallback(async (): Promise<User | null> => {
        try {
            const userData = await getCurrentUserAction();
            if (userData) {
                try {
                    const committees = await authApi.fetchAndPersistUserCommittees(userData.id);
                    const enrichedUser = { ...userData, committees };
                    setUser(enrichedUser);
                    return enrichedUser;
                } catch (e) {
                    setUser(userData);
                    return userData;
                }
            } else {
                setUser(null);
                return null;
            }
        } catch (error) {
            console.error('[useSession] Error fetching session:', error);
            setUser(null);
            return null;
        }
    }, []);

    const clearSession = useCallback(() => {
        setUser(null);
        // Clear User specific local storage
        if (user?.id) {
            localStorage.removeItem(`user_committees_${user.id}`);
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
    }, [user?.id]);

    return {
        user,
        setUser,
        isLoading,
        setIsLoading,
        fetchSession,
        clearSession
    };
}
