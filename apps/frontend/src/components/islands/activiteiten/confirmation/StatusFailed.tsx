'use client';

import { XCircle, RefreshCw, Home } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';
import { slugify } from '@/shared/lib/utils/slug';
import { type SignupData } from '../ConfirmationIsland';

interface StatusFailedProps {
    signupData: SignupData | null;
    isMembership: boolean;
    isTrip: boolean;
}

export default function StatusFailed({ signupData, isMembership, isTrip }: StatusFailedProps) {
    const isCanceled = signupData?.errorType === 'canceled';
    const isExpired = signupData?.errorType === 'expired';

    return (
        <div className="animate-in zoom-in-95 space-y-8 py-20 text-center duration-500">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
                <XCircle className="size-12 text-red-500" />
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-semibold tracking-tighter text-(--text-main) italic">
                    Betaling <span className="text-red-500">{isCanceled ? 'gecanceld' : isExpired ? 'verlopen' : 'mislukt'}</span>
                </h2>
                <p className="mx-auto max-w-md text-lg font-medium text-(--text-muted)">
                    {isCanceled
                        ? 'Je hebt de betaling afgebroken. Geen zorgen, je gegevens zijn nog niet verwerkt.'
                        : isExpired
                            ? 'De betaalsessie is verlopen. Probeer het opnieuw om je aanmelding te voltooien.'
                            : 'Helaas is je betaling niet gelukt. Probeer het opnieuw of neem contact op als dit probleem blijft optreden.'}
                </p>
            </div>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <BackButton
                    href={
                        isMembership ? '/lidmaatschap' :
                            isTrip ? '/reis' :
                                (signupData?.event_id?.name ? `/activiteiten/${slugify(signupData.event_id.name)}` : '/activiteiten')
                    }
                    text="Opnieuw proberen"
                    icon={RefreshCw}
                    className="h-14 rounded-2xl bg-(--theme-purple) px-10 text-white shadow-(--theme-purple)/20 shadow-xl"
                />
                <BackButton
                    href="/"
                    text="Terug naar home"
                    icon={Home}
                    className="h-14 rounded-2xl border border-(--border-color) bg-(--bg-card) px-10 text-(--text-main)"
                />
            </div>
        </div>
    );
}
