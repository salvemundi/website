'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';

// Context for managing overlay state
interface AuthOverlayContextValue {
    activeOverlay: 'none' | 'login' | 'unauthorized';
}

const AuthOverlayContext = createContext<AuthOverlayContextValue>({
    activeOverlay: 'none',
});

interface AuthOverlayProps {
    children: ReactNode;
    activeOverlay?: 'none' | 'login' | 'unauthorized';
}

/**
 * AuthOverlay Compound Component
 * Manages authentication-related overlays with a declarative API
 * 
 * Usage:
 * <AuthOverlay>
 *   <AuthOverlay.Trigger condition="unauthenticated">
 *     <LoginPromptOverlay />
 *   </AuthOverlay.Trigger>
 *   <AuthOverlay.Trigger condition="unauthorized">
 *     <NoAccessOverlay />
 *   </AuthOverlay.Trigger>
 *   <AuthOverlay.Content blurred>
 *     {children}
 *   </AuthOverlay.Content>
 * </AuthOverlay>
 */
export function AuthOverlay({ children, activeOverlay = 'none' }: AuthOverlayProps) {
    const contextValue = useMemo(
        () => ({ activeOverlay }),
        [activeOverlay]
    );

    return (
        <AuthOverlayContext.Provider value={contextValue}>
            <div className="relative min-h-screen">
                {children}
            </div>
        </AuthOverlayContext.Provider>
    );
}

// Sub-component: Conditional trigger
interface TriggerProps {
    condition: 'unauthenticated' | 'unauthorized';
    children: ReactNode;
}

const Trigger = ({ condition, children }: TriggerProps) => {
    const { activeOverlay } = useContext(AuthOverlayContext);

    if (condition === 'unauthenticated' && activeOverlay === 'login') {
        return <>{children}</>;
    }

    if (condition === 'unauthorized' && activeOverlay === 'unauthorized') {
        return <>{children}</>;
    }

    return null;
};

Trigger.displayName = 'AuthOverlay.Trigger';
AuthOverlay.Trigger = Trigger;

// Sub-component: Content wrapper (blurs when overlay active)
interface ContentProps {
    children: ReactNode;
    blurred?: boolean;
}

const Content = ({ children, blurred = true }: ContentProps) => {
    const { activeOverlay } = useContext(AuthOverlayContext);
    const isBlurred = blurred && activeOverlay !== 'none';

    return (
        <div
            className={`transition-all duration-300 ${isBlurred ? 'blur-sm pointer-events-none select-none' : ''
                }`}
            aria-hidden={isBlurred}
        >
            {children}
        </div>
    );
};

Content.displayName = 'AuthOverlay.Content';
AuthOverlay.Content = Content;

// Hook to access overlay context
export function useAuthOverlay() {
    const context = useContext(AuthOverlayContext);
    if (!context) {
        throw new Error('useAuthOverlay must be used within an AuthOverlay');
    }
    return context;
}
