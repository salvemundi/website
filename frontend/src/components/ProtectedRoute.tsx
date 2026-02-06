'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthOverlay } from '@/components/AuthOverlay';
import LoginPromptOverlay from '@/components/AuthOverlay/LoginPromptOverlay';
import NoAccessOverlay from '@/components/AuthOverlay/NoAccessOverlay';
import PageSkeleton from '@/components/AuthOverlay/PageSkeleton';
import { useAuthStatus, useAuthUser } from '@/features/auth/providers/auth-provider';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean;
    requireRoles?: string[];
    requirePermissions?: string[];
    /** @deprecated Redirects are no longer supported. The component will always use the overlay strategy. */
    fallback?: 'overlay' | 'redirect';
    skeleton?: ReactNode;
}

/**
 * ProtectedRoute Component
 * Declarative wrapper for protecting routes based on authentication and authorization
 * 
 * Usage:
 * <ProtectedRoute requireAuth requireRoles={['admin']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * Features:
 * - Optimistic rendering with cached user data
 * - Background authorization checks
 * - In-place overlays (Seamless Auth Architecture - Zero Redirects)
 * - Configurable fallback behavior (Deprecated: always uses overlay)
 */
export default function ProtectedRoute({
    children,
    requireAuth = true,
    requireRoles = [],
    requirePermissions = [],
    fallback = 'overlay',
    skeleton = <PageSkeleton />,
}: ProtectedRouteProps) {
    const router = useRouter();

    // Consuming granular selectors to minimize re-renders during state hydration
    const authStatusContext = useAuthStatus();
    const user = useAuthUser();

    const authStatus = authStatusContext.status;

    const [checkState, setCheckState] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

    // Provide backward compatibility for existing login patterns that expect hard redirects
    useEffect(() => {
        if (checkState === 'unauthorized' && fallback === 'redirect' && authStatus === 'unauthenticated') {
            // [ARCHITECTURAL CHANGE] - Seamless Auth
            // We no longer redirect to /login. Instead, we enforce the overlay strategy.
            // This ensures users stay on the context they are trying to access.
            // The fallback prop is ignored for logic but kept for type compatibility.
        }
    }, [checkState, fallback, authStatus, router]);

    useEffect(() => {
        const checkAccess = async () => {
            // Stall rendering until the silent authentication engine has attempted hydration
            if (authStatus === 'checking') {
                setCheckState('checking');
                return;
            }

            // If no authentication is required, it's authorized
            if (!requireAuth) {
                setCheckState('authorized');
                return;
            }

            // Trigger the unauthorized UI chain (overlay or legacy redirect)
            if (authStatus === 'unauthenticated') {
                setCheckState('unauthorized');
                return;
            }

            // Authenticated state reached; evaluate granular authorization requirements
            if (user) {
                // Check roles if required
                if (requireRoles.length > 0) {
                    const userRoles = (user as any)?.roles || []; // Assuming 'roles' property on User
                    const hasRole = requireRoles.some(role => userRoles.includes(role));

                    if (!hasRole) {
                        setCheckState('unauthorized');
                        return;
                    }
                }

                // Check permissions if required
                if (requirePermissions.length > 0) {
                    const userPermissions = (user as any)?.permissions || []; // Assuming 'permissions' property on User
                    const hasPermission = requirePermissions.every(perm =>
                        userPermissions.includes(perm)
                    );

                    if (!hasPermission) {
                        setCheckState('unauthorized');
                        return;
                    }
                }
            } else {
                // User is authenticated but user object is null/undefined,
                // this might indicate an issue or a transient state.
                // For now, treat as unauthorized if auth is required but user data is missing.
                setCheckState('unauthorized');
                return;
            }

            // If all checks pass
            setCheckState('authorized');
        };

        checkAccess();
    }, [authStatus, user, requireAuth, requireRoles, requirePermissions]);

    // Render strategy
    if (checkState === 'checking') {
        return <>{skeleton}</>;
    }

    if (checkState === 'unauthorized') {
        // [ARCHITECTURAL CHANGE] - Even if fallback='redirect' was requested, 
        // we now enforce the overlay to maintain the "Seamless Auth" experience.

        // Default: In-place overlay (RECOMMENDED)
        const overlayType = authStatus === 'unauthenticated' ? 'login' : 'unauthorized';

        return (
            <AuthOverlay activeOverlay={overlayType}>
                <AuthOverlay.Trigger condition="unauthenticated">
                    <LoginPromptOverlay
                        message="Deze pagina vereist dat je ingelogd bent"
                    />
                </AuthOverlay.Trigger>
                <AuthOverlay.Trigger condition="unauthorized">
                    <NoAccessOverlay
                        requiredRoles={requireRoles}
                        message={
                            requireRoles.length > 0
                                ? `Deze pagina is alleen toegankelijk voor gebruikers met de rol${requireRoles.length > 1 ? 'len' : ''}: ${requireRoles.join(', ')}`
                                : undefined
                        }
                    />
                </AuthOverlay.Trigger>
                <AuthOverlay.Content blurred>
                    {children}
                </AuthOverlay.Content>
            </AuthOverlay>
        );
    }

    // Explicit authorized check
    if (checkState === 'authorized') {
        return <>{children}</>;
    }

    // Defensive fallback - should never reach here
    console.error('[ProtectedRoute] Invalid checkState:', checkState);
    return <>{skeleton}</>;
}
