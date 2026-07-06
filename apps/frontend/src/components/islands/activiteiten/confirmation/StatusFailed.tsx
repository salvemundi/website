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
        <div className="py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/20">
                <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-semibold text-(--text-main) tracking-tighter italic">
                    Betaling <span className="text-red-500">{isCanceled ? 'gecanceld' : isExpired ? 'verlopen' : 'mislukt'}</span>
                </h2>
                <p className="text-(--text-muted) text-lg font-medium max-w-md mx-auto">
                    {isCanceled
                        ? 'Je hebt de betaling afgebroken. Geen zorgen, je gegevens zijn nog niet verwerkt.'
                        : isExpired
                            ? 'De betaalsessie is verlopen. Probeer het opnieuw om je aanmelding te voltooien.'
                            : 'Helaas is je betaling niet gelukt. Probeer het opnieuw of neem contact op als dit probleem blijft optreden.'}
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <BackButton
                    href={
                        isMembership ? '/lidmaatschap' :
                            isTrip ? '/reis' :
                                (signupData?.event_id?.name ? `/activiteiten/${slugify(signupData.event_id.name)}` : '/activiteiten')
                    }
                    text="Opnieuw proberen"
                    icon={RefreshCw}
                    className="h-14 px-10 rounded-2xl bg-(--theme-purple) text-white shadow-xl shadow-(--theme-purple)/20"
                />
                <BackButton
                    href="/"
                    text="Terug naar home"
                    icon={Home}
                    className="h-14 px-10 rounded-2xl bg-(--bg-card) border border-(--border-color) text-(--text-main)"
                />
            </div>
        </div>
    );
}
