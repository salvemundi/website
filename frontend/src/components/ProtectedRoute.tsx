'use client';

import { useEffect, useState, ReactNode } from 'react';
import { AuthOverlay } from '@/components/AuthOverlay';
import NoAccessOverlay from '@/components/AuthOverlay/NoAccessOverlay';
import PageSkeleton from '@/components/AuthOverlay/PageSkeleton';
import { useAuthStatus, useAuthUser, useAuthActions } from '@/features/auth/providers/auth-provider';

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
 * Flow:
 * 1. If not authenticated: Redirect immediately (User preference: reliability over seamlessness)
 * 2. If authenticated but unauthorized: Show NoAccessOverlay
 */
export default function ProtectedRoute({
    children,
    requireAuth = true,
    requireRoles = [],
    requirePermissions = [],
    skeleton = <PageSkeleton />,
}: ProtectedRouteProps) {
    const authStatusContext = useAuthStatus();
    const user = useAuthUser();
    const authActions = useAuthActions();

    const authStatus = authStatusContext.status;
    const [checkState, setCheckState] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

    useEffect(() => {
        const checkAccess = async () => {
            if (authStatus === 'checking') {
                setCheckState('checking');
                return;
            }

            if (!requireAuth) {
                setCheckState('authorized');
                return;
            }

            if (authStatus === 'unauthenticated') {
                // Immediate redirect as per user preference
                authActions.loginWithRedirect(window.location.pathname + window.location.search);
                return;
            }

            if (user) {
                if (requireRoles.length > 0) {
                    const userRoles = (user as any)?.roles || [];
                    const hasRole = requireRoles.some(role => userRoles.includes(role));
                    if (!hasRole) {
                        setCheckState('unauthorized');
                        return;
                    }
                }

                if (requirePermissions.length > 0) {
                    const userPermissions = (user as any)?.permissions || [];
                    const hasPermission = requirePermissions.every(perm => userPermissions.includes(perm));
                    if (!hasPermission) {
                        setCheckState('unauthorized');
                        return;
                    }
                }
            } else {
                setCheckState('unauthorized');
                return;
            }

            setCheckState('authorized');
        };

        checkAccess();
    }, [authStatus, user, requireAuth, requireRoles, requirePermissions, authActions]);

    if (checkState === 'checking') return <>{skeleton}</>;

    if (authStatus === 'unauthenticated') return <>{skeleton}</>; // Waiting for redirect

    if (checkState === 'unauthorized') {
        return (
            <AuthOverlay activeOverlay="unauthorized">
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

    if (checkState === 'authorized') return <>{children}</>;

    return <>{skeleton}</>;
}
