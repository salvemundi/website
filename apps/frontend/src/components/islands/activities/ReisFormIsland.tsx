'use client';

import React, { useState } from 'react';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations';
import { authClient } from '@/lib/auth-client';
import { ReisSignupStatus } from './ReisSignupStatus';
import { ReisRegistrationForm } from './ReisRegistrationForm';

interface ReisFormIslandProps {
    nextTrip: ReisTrip | null;
    userSignup: ReisTripSignup | null;
    canSignUp: boolean;
    registrationStartText: string;
    participantsCount: number;
}

export function ReisFormIsland({ nextTrip, userSignup, canSignUp, registrationStartText }: ReisFormIslandProps) {
    const { data: session } = authClient.useSession();
    const currentUser = session?.user;
    const [error, setError] = useState<string | null>(null);

    return (
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-theme-purple dark:text-theme-white mb-4 sm:mb-6">
                Inschrijven voor de Reis
            </h1>

            {userSignup ? (
                <ReisSignupStatus 
                    userSignup={userSignup} 
                    nextTrip={nextTrip} 
                    error={error} 
                />
            ) : (
                <ReisRegistrationForm 
                    nextTrip={nextTrip}
                    canSignUp={canSignUp}
                    registrationStartText={registrationStartText}
                    currentUser={currentUser}
                />
            )}
        </section>
    );
}
