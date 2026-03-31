'use client';

import React, { useTransition } from 'react';
import DeletionTimer from '@/components/ui/account/DeletionTimer';
import { initiateMembershipPaymentAction } from '@/server/actions/membership.actions';
import type { SignupFormData } from '@salvemundi/validations';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

export interface MembershipUserData {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    membership_status?: string;
    membership_expiry?: string;
    phone_number?: string;
    date_of_birth?: string;
}

interface MembershipStatusIslandProps {
    user: MembershipUserData;
    baseAmount: number;
}

export default function MembershipStatusIsland({ user, baseAmount }: MembershipStatusIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const isExpired = user.membership_status !== 'active';

    const handleRenewal = async () => {
        startTransition(async () => {
            const formData: SignupFormData = {
                voornaam: user.first_name,
                achternaam: user.last_name || '',
                tussenvoegsel: '',
                email: user.email,
                telefoon: user.phone_number || '',
                geboortedatum: user.date_of_birth || '',
                coupon: '',
            };

            const result = await initiateMembershipPaymentAction(formData);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                showToast(result.error || 'Er ging iets mis bij het starten van de betaling', 'error');
            }
        });
    };

    if (!isExpired) {
        return (
            <div className="text-theme-text dark:text-white animate-in fade-in duration-500">
                <div className="bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 dark:border-green-500/40 p-5 rounded-2xl mb-6 flex items-start gap-4">
                    <div className="bg-green-500 rounded-full p-1 mt-0.5 shadow-sm shadow-green-500/20">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-green-700 dark:text-green-400 text-lg leading-tight">Actief Lid</p>
                        <p className="text-sm opacity-80 dark:text-white/70">Je bent een volwaardig lid van Salve Mundi.</p>
                    </div>
                </div>

                <p className="mb-6 text-lg">
                    Welkom terug, <span className="font-bold text-theme-purple dark:text-purple-400">{user.first_name}</span>!
                </p>

                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 p-5 rounded-3xl mb-8">
                    <p className="text-xs text-theme-purple dark:text-purple-400 font-bold uppercase tracking-widest mb-3">Jouw gegevens</p>
                    <div className="space-y-1">
                        <p className="font-bold text-xl leading-tight dark:text-white">
                            {user.first_name} {user.last_name}
                        </p>
                        <p className="opacity-60 dark:text-white/60 text-sm break-words font-medium">
                            <span className="opacity-70">E-mailadres:</span> {user.email.split('').map((char, i) => (
                                <span key={i}>
                                    {char}
                                    {(char === '@' || char === '.' || char === '-' || char === '_') && <wbr />}
                                </span>
                            ))}
                        </p>
                    </div>
                    {user.membership_expiry && (
                        <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800/30">
                            <p className="opacity-70 dark:text-white/70 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-theme-purple dark:bg-purple-400"></span>
                                Geldig tot: <span className="font-bold">{new Date(user.membership_expiry).toLocaleDateString('nl-NL')}</span>
                            </p>
                        </div>
                    )}
                </div>

                <p className="text-sm opacity-50 italic text-center">
                    Je hoeft op dit moment geen actie te ondernemen.
                </p>
            </div>
        );
    }

    return (
        <div className="text-theme-text dark:text-white animate-in fade-in duration-500">
            {user.membership_expiry && <DeletionTimer expiryDateStr={user.membership_expiry} />}

            <div className="mb-6">
                <p className="mb-2 text-2xl font-bold text-theme-purple dark:text-purple-400 leading-tight">
                    Welkom terug, {user.first_name}.
                </p>
                <p className="opacity-80 text-lg leading-relaxed">
                    Je lidmaatschap is verlopen. Om weer toegang te krijgen tot alle activiteiten en je account te behouden, vragen we je de jaarlijkse contributie te voldoen.
                </p>
            </div>

            <div className="bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 rounded-3xl p-6 mb-8 text-center">
                <p className="text-sm font-bold text-theme-purple dark:text-purple-400 uppercase tracking-widest mb-6">Contributie Verlengen</p>
                <button
                    onClick={handleRenewal}
                    disabled={isPending}
                    className="form-button shadow-glow transition-transform active:scale-95"
                >
                    {isPending ? 'Verwerken...' : `Nu Verlengen (€${baseAmount.toFixed(2).replace('.', ',')})`}
                </button>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
