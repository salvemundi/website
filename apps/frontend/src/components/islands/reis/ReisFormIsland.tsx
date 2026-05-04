'use client';

import React, { useState } from 'react';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations/schema/reis.zod';
import { authClient } from '@/lib/auth';
import { ReisSignupStatus } from './ReisSignupStatus';
import { ReisRegistrationForm } from './ReisRegistrationForm';
import { RefreshCcw, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { revalidateReisAction } from '@/server/actions/reis.actions';

interface ReisFormIslandProps {
    isSignedUp?: boolean;
    isReisDisabled?: boolean;
    nextTrip: ReisTrip | null;
    userSignup: ReisTripSignup | null;
    canSignUp: boolean;
    registrationStartText: string;
    participantsCount: number;
    initialUser?: any;
}

export function ReisFormIsland({ 
    nextTrip, 
    userSignup, 
    canSignUp, 
    registrationStartText,
    initialUser 
}: ReisFormIslandProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    
    // We prioritize the server-provided user to avoid any flicker.
    const currentUser = initialUser || session?.user;
    
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Force a server-side revalidation of the path
            await revalidateReisAction();
            
            // Re-fetch the session client-side to ensure no stale auth state
            await authClient.getSession();

            // Trigger the server component to re-render with fresh data
            router.refresh();
        } catch (error) {
            // Error handling ignored as per legacy
        } finally {
            // Keep the spinner going for a moment to indicate activity
            setTimeout(() => setRefreshing(false), 800);
        }
    };

    return (
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-2xl p-6 sm:p-10 relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-theme-purple/5 rounded-full blur-3xl group-hover:bg-theme-purple/10 transition-colors duration-700" />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8 sm:mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-theme-purple font-semibold text-[10px] uppercase tracking-[0.2em] mb-1">
                            <Sparkles className="h-3 w-3" />
                            <span>Studiereis {new Date().getFullYear() + (new Date().getMonth() > 8 ? 1 : 0)}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-theme-purple dark:text-theme-white tracking-tight">
                            Inschrijven
                        </h1>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-3 bg-theme-purple/5 hover:bg-theme-purple/10 rounded-2xl text-[var(--text-muted)] hover:text-theme-purple transition-all disabled:opacity-50 active:scale-90"
                        title="Gegevens vernieuwen"
                    >
                        <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {userSignup ? (
                        <ReisSignupStatus
                            userSignup={userSignup}
                            nextTrip={nextTrip}
                            error={null}
                        />
                    ) : (
                        <ReisRegistrationForm
                            nextTrip={nextTrip}
                            canSignUp={canSignUp}
                            registrationStartText={registrationStartText}
                            currentUser={currentUser}
                            onRefresh={handleRefresh}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
