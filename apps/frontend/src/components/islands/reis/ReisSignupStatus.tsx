'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Utensils } from 'lucide-react';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations/schema/reis.zod';

interface ReisSignupStatusProps {
    userSignup: ReisTripSignup;
    nextTrip: ReisTrip | null;
    error: string | null;
}

export function ReisSignupStatus({ userSignup, nextTrip, error }: ReisSignupStatusProps) {
    const getSignupStatusDisplay = (signup: ReisTripSignup) => {
        if (signup.status === 'waitlist') return 'Wachtrij';
        if (signup.status === 'cancelled') return 'Geannuleerd';
        if (signup.status === 'registered') return 'Geregistreerd';
        if (signup.status === 'confirmed') {
            if (signup.full_payment_paid) return 'Geregistreerd (Betaald)';
            if (!signup.deposit_paid) return 'Aanbetaling verwacht';
            return 'Restbetaling verwacht';
        }
        return 'In afwachting';
    };

    return (
        <div className="bg-gradient-to-br from-theme-purple/5 to-theme-purple/10 rounded-2xl p-6 border border-theme-purple/20">
            {error && (
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                    {error}
                </div>
            )}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-theme-purple/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-theme-purple" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-theme-purple dark:text-theme-white">Jouw Status</h3>
                    <p className="text-theme-text-muted text-sm">Je bent al aangemeld voor deze reis</p>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-black/5 rounded-2xl p-6 border border-theme-purple/10 mb-6">
                <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Huidige status</p>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-2xl sm:text-3xl font-black text-theme-purple dark:text-theme-white break-words">
                            {getSignupStatusDisplay(userSignup)}
                        </p>
                        {userSignup.status === 'registered' && (
                            <p className="text-xs text-[var(--text-muted)] mt-1 italic">
                                Je aanmelding wordt momenteel beoordeeld door de commissie.
                            </p>
                        )}
                    </div>
                    <div className="px-3 py-1 bg-theme-purple/10 rounded-full text-xs font-bold text-theme-purple uppercase shrink-0">
                        {userSignup.status}
                    </div>
                </div>
            </div>

            {userSignup.status === 'confirmed' && !userSignup.full_payment_paid && (
                <div className="mt-4 pt-4 border-t border-theme-purple/20 space-y-4">
                    {!userSignup.deposit_paid ? (
                        <Link
                            href={`/reis/betalen/aanbetaling?id=${userSignup.id}`}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition group"
                        >
                            <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            Ga naar aanbetaling
                        </Link>
                    ) : (
                        <div className="space-y-4">
                            {nextTrip?.allow_final_payments ? (
                                <Link
                                    href={`/reis/betalen/restbetaling?id=${userSignup.id}`}
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition group"
                                >
                                    <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    Afronden & Betalen
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={`/reis/betalen/restbetaling?id=${userSignup.id}`}
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition group"
                                    >
                                        <Utensils className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                        Activiteiten beheren
                                    </Link>
                                    <p className="text-xs italic text-[var(--text-muted)] leading-relaxed">
                                        De restbetaling is momenteel nog niet geopend. Je kunt wel alvast je activiteiten doorgeven of wijzigen.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
