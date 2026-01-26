'use client';

import { useAuth } from '@/features/auth/providers/auth-provider';
import { ScrollTriggerWrapper } from '@/shared/ui/ScrollTriggerWrapper';
import Link from 'next/link';

export default function JoinSection() {
    const { user, isAuthenticated, isLoading } = useAuth();

    // While loading auth state, we don't know whether to show or hide the section.
    // To prevent layout shift, we can return null or a placeholder.
    // Given the design, it's safer to hide it until we know.
    if (isLoading) return null;

    // If the user is an active member, we don't show the "Join" section.
    if (isAuthenticated && user?.is_member) {
        return null;
    }

    // Determine the text based on membership status
    const isExpired = isAuthenticated && (user?.membership_status === 'expired' || !user?.is_member);

    // Check if the user has ever been a member but it's not active anymore.
    // If they have an expiry date but 'is_member' is false, it's definitely a renewal.
    const isRenewal = isAuthenticated && user?.membership_expiry && !user?.is_member;

    const title = isRenewal ? "Lidmaatschap verlopen?" : "Klaar om lid te worden?";
    const buttonText = isRenewal ? "Verlengen" : "Word nu lid";
    const description = isRenewal
        ? "Je lidmaatschap is niet meer geldig. Verleng je lidmaatschap voor slechts €20 per jaar en behoud toegang tot alle activiteiten met korting!"
        : "Sluit je aan bij onze community van studenten en maak het meeste van je studententijd. Voor slechts €20 per jaar krijg je toegang tot alle activiteiten met korting!";

    return (
        <section className="px-6 py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <ScrollTriggerWrapper animation="scale" duration={0.9} triggerStart="top 100%" once={true}>
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl mb-6">
                        {title}
                    </h2>
                    <p className="text-lg text-theme-muted mb-8 max-w-2xl mx-auto">
                        {description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/lidmaatschap"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-theme px-8 py-4 text-base font-semibold text-theme-white shadow-xl transition hover:scale-105"
                        >
                            {buttonText}
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-transparent px-8 py-4 text-base font-semibold text-theme-purple transition hover:bg-theme-purple/5 hover:scale-105"
                        >
                            Neem contact op
                        </Link>
                    </div>
                </div>
            </ScrollTriggerWrapper>
        </section>
    );
}
