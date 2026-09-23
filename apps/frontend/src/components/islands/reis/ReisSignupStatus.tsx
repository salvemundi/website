'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Utensils } from 'lucide-react';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations/schema/trip.zod';

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

        if (signup.full_payment_paid) return 'Geregistreerd (Betaald)';
        if (!signup.deposit_paid) {
            return nextTrip?.allow_deposit_payments ? 'Aanbetaling verwacht' : 'Aanbetaling nog niet geopend';
        }
        if (!nextTrip?.allow_final_payments) return 'Aanbetaling voldaan';
        return 'Restbetaling verwacht';
    };

    return (
        <div className="rounded-2xl border border-theme-purple/20 bg-linear-to-br from-theme-purple/5 to-theme-purple/10 p-6">
            {error && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                    {error}
                </div>
            )}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-theme-purple/20">
                    <CheckCircle2 className="size-8 text-theme-purple" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-theme-purple dark:text-white">Huidige status</h3>
                </div>
            </div>

            <div className="mb-6 rounded-2xl border border-theme-purple/10 bg-white/50 p-6 dark:bg-black/5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-2xl font-bold tracking-tight wrap-break-word text-theme-purple sm:text-3xl dark:text-white">
                            {getSignupStatusDisplay(userSignup)}
                        </p>
                        {userSignup.status === 'registered' && (
                            <p className="mt-1 text-xs text-text-muted italic">
                                Je aanmelding wordt momenteel beoordeeld door de commissie.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {userSignup.status === 'confirmed' && !userSignup.full_payment_paid && (
                <div className="mt-4 space-y-4 border-t border-theme-purple/20 pt-4">
                    {!userSignup.deposit_paid ? (
                        nextTrip?.allow_deposit_payments ? (
                            <Link
                                href={`/reis/betalen/aanbetaling?id=${userSignup.id}`}
                                className="group inline-flex items-center gap-2 rounded-lg bg-theme-purple px-6 py-2 text-white transition hover:bg-theme-purple-dark"
                            >
                                <CreditCard className="size-5 transition-transform group-hover:scale-110" />
                                Ga naar aanbetaling
                            </Link>
                        ) : (
                            <p className="text-xs leading-relaxed text-text-muted italic">
                                De aanbetalingen zijn momenteel nog niet geopend voor deze reis. Je ontvangt een e-mail zodra je kunt betalen.
                            </p>
                        )
                    ) : (
                        <div className="space-y-4">
                            {nextTrip?.allow_final_payments ? (
                                <Link
                                    href={`/reis/betalen/restbetaling?id=${userSignup.id}`}
                                    className="group inline-flex items-center gap-2 rounded-lg bg-theme-purple px-6 py-2 text-white transition hover:bg-theme-purple-dark"
                                >
                                    <CreditCard className="size-5 transition-transform group-hover:scale-110" />
                                    Afronden & Betalen
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={`/reis/betalen/restbetaling?id=${userSignup.id}`}
                                        className="group inline-flex items-center gap-2 rounded-lg bg-theme-purple px-6 py-2 text-white transition hover:bg-theme-purple-dark"
                                    >
                                        <Utensils className="size-5 transition-transform group-hover:scale-110" />
                                        Activiteiten beheren
                                    </Link>
                                    <p className="text-xs leading-relaxed text-(--text-muted) italic">
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
