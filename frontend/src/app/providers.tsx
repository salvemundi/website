'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { PWAProvider } from '@/features/pwa/lib/PWAContext';
import { Toaster } from 'sonner';
import { MainLayout } from '@/shared/ui/MainLayout';

import { ThemeProvider } from 'next-themes';

function AppInner({ children }: { children: React.ReactNode }) {
    return (
        <>
            <MainLayout>
                {children}
            </MainLayout>
        </>
    );
}

export function RootProviders({ children }: { children: React.ReactNode }) {
    // Create QueryClient instance in state to ensure it's stable across renders
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <PWAProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <AppInner>{children}</AppInner>
                        <Toaster position="bottom-right" richColors />
                    </AuthProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </PWAProvider>
    );
}
