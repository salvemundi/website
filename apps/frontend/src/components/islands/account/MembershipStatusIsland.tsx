'use client';

import { useTransition } from 'react';
import DeletionTimer from '@/components/ui/account/DeletionTimer';
import { initiateMembershipPaymentAction } from '@/server/actions/profile/membership.actions';
import type { SignupFormData } from '@salvemundi/validations/schema/membership.zod';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { formatDate } from '@/shared/lib/utils/date';

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

    const canRenew = !user.membership_expiry || (() => {
        const expiryDate = new Date(user.membership_expiry);
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        return expiryDate <= oneMonthFromNow;
    })();

    const handleRenewal = async () => {
        startTransition(async () => {
            const formData: SignupFormData = {
                voornaam: user.first_name,
                achternaam: user.last_name || '',
                email: user.email,
                telefoon: user.phone_number || '',
                geboortedatum: user.date_of_birth || '',
                coupon: ''
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
            <div className="text-theme-text dark:text-white">
                <div className="squircle mb-6 flex items-start gap-4 border border-green-500/20 bg-green-500/10 p-5 dark:border-green-500/40 dark:bg-green-500/20">
                    <div className="mt-0.5 rounded-full bg-green-500 p-1 shadow-sm shadow-green-500/20">
                        <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-lg leading-tight font-bold text-green-700 dark:text-green-400">Actief Lid</p>
                        <p className="text-sm opacity-80 dark:text-white/70">Je bent een lid van Salve Mundi.</p>
                    </div>
                </div>

                <p className="mb-6 text-lg">
                    Welkom terug, <span className="font-bold text-theme-purple dark:text-purple-400">{user.first_name}</span>!
                </p>

                <div className="squircle-lg mb-8 border border-purple-100 bg-purple-50 p-5 dark:border-purple-800/30 dark:bg-purple-900/10">
                    <p className="mb-3 text-xs font-bold tracking-widest text-theme-purple uppercase dark:text-purple-400">Jouw gegevens</p>
                    <div className="space-y-1">
                        <p className="text-xl leading-tight font-bold dark:text-white">
                            {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm font-medium wrap-break-word opacity-60 dark:text-white/60">
                            <span className="opacity-70">E-mailadres:</span> {user.email.split('').map((char, i) => (
                                <span key={i}>
                                    {char}
                                    {(char === '@' || char === '.' || char === '-' || char === '_') && <wbr />}
                                </span>
                            ))}
                        </p>
                    </div>
                    {user.membership_expiry && (
                        <div className="mt-4 border-t border-purple-100 pt-4 dark:border-purple-800/30">
                            <p className="flex items-center gap-2 text-sm opacity-70 dark:text-white/70">
                                <span className="size-1.5 rounded-full bg-theme-purple dark:bg-purple-400"></span>
                                Geldig tot: <span className="font-bold">{formatDate(user.membership_expiry)}</span>
                            </p>
                        </div>
                    )}
                </div>

                {canRenew && (
                    <div className="squircle-lg mb-4 border border-purple-100 bg-purple-50 p-6 text-center dark:border-white/10 dark:bg-white/5">
                        <p className="mb-2 text-sm font-bold tracking-widest text-theme-purple uppercase dark:text-purple-400">Lidmaatschap Verlengen</p>
                        <p className="mb-6 text-sm opacity-80">
                            Wil je je lidmaatschap alvast met een jaar verlengen?
                        </p>
                        {baseAmount === 10 && (
                            <div className="squircle mb-4 flex items-center justify-center gap-3 border border-purple-500/20 bg-purple-500/10 p-3">
                                <span className="rounded-full bg-purple-500 px-2 py-0.5 text-[10px] font-black text-white uppercase">Actief Lid</span>
                                <p className="text-xs font-bold text-theme-purple dark:text-purple-400">
                                    Commissie-korting toegepast: Jouw verlenging kost slechts €10,00.
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => { void handleRenewal(); }}
                            disabled={isPending}
                            className="form-button shadow-glow transition-transform active:scale-95"
                        >
                            {isPending ? 'Verwerken...' : `Nu Verlengen (€${baseAmount.toFixed(2).replace('.', ',')})`}
                        </button>
                    </div>
                )}

                <AdminToast toast={toast} onClose={hideToast} />
            </div>
        );
    }

    return (
        <div className="text-theme-text dark:text-white">
            {user.membership_expiry && <DeletionTimer expiryDateStr={user.membership_expiry} />}

            <div className="mb-6">
                <p className="mb-2 text-2xl leading-tight font-bold text-theme-purple dark:text-purple-400">
                    Welkom terug, {user.first_name}.
                </p>
                <p className="text-lg leading-relaxed opacity-80">
                    Je lidmaatschap is verlopen. Om weer toegang te krijgen tot alle activiteiten en je account te behouden, vragen we je de jaarlijkse contributie te voldoen.
                </p>
                {baseAmount === 10 && (
                    <div className="squircle mt-4 flex items-center gap-3 border border-purple-500/20 bg-purple-500/10 p-3">
                        <span className="rounded-full bg-purple-500 px-2 py-0.5 text-[10px] font-black text-white uppercase">Actief Lid</span>
                        <p className="text-sm font-bold text-theme-purple dark:text-purple-400">
                            Commissie-korting toegepast: Jouw verlenging kost slechts €10,00.
                        </p>
                    </div>
                )}
            </div>

            <div className="squircle-lg mb-8 border border-purple-100 bg-purple-50 p-6 text-center dark:border-white/10 dark:bg-white/5">
                <p className="mb-6 text-sm font-bold tracking-widest text-theme-purple uppercase dark:text-purple-400">Contributie Verlengen</p>
                <button
                    onClick={() => { void handleRenewal(); }}
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
