import { Suspense } from 'react';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { MEMBERSHIP_CONFIG } from '@/shared/config/membership';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { MembershipForm } from './_components/MembershipForm';
import { RenewalSection } from './_components/RenewalSection';
import { MembershipSkeleton } from './_components/MembershipSkeleton';

export const metadata = {
    title: 'Lidmaatschap | Salve Mundi',
    description: 'Word lid van Salve Mundi of beheer je huidige lidmaatschap.',
};

async function MembershipContent() {
    const user = await getCurrentUserAction();

    const isMember = user?.is_member === true;
    const isExpired = user && user.is_member === false;
    const isGuest = !user;

    // Determine base amount based on committee membership
    const isCommitteeMember = user?.committees && user.committees.length > 0;
    const baseAmount = isCommitteeMember ? MEMBERSHIP_CONFIG.price_committee : MEMBERSHIP_CONFIG.price_regular;

    let formTitle = "Inschrijfformulier";
    if (isMember) formTitle = "Huidige Status";
    else if (isExpired) formTitle = "Verlengen";

    return (
        <div className="flex flex-col sm:flex-row gap-6 px-6 py-8 sm:py-10 md:py-12">
            <section className="w-full sm:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-6 sm:p-8">
                <h2 className="text-3xl font-bold text-theme-purple dark:text-theme-white mb-6">
                    {formTitle}
                </h2>

                {isMember && (
                    <div className="text-theme-text">
                        <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl mb-6 flex items-start gap-4">
                            <div className="bg-green-500 rounded-full p-1 mt-0.5">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-green-600 dark:text-green-400 text-lg">Actief Lid</p>
                                <p className="text-sm text-theme-text-subtle">Je bent een volwaardig lid van Salve Mundi.</p>
                            </div>
                        </div>

                        <p className="mb-6 text-lg">
                            Welkom terug, <span className="font-bold text-theme-purple">{user.first_name}</span>!
                        </p>

                        <div className="bg-theme-purple/5 border border-theme-purple/10 p-5 rounded-2xl mb-8">
                            <p className="text-xs text-theme-purple font-bold uppercase tracking-widest mb-3">Jouw gegevens</p>
                            <div className="space-y-1">
                                <p className="text-theme-text font-bold text-lg leading-tight flex flex-wrap gap-x-1">
                                    <span>{user.first_name}</span>
                                    {user.last_name && <span>{user.last_name}</span>}
                                </p>
                                <p className="text-theme-text-muted text-sm break-all leading-snug">
                                    {user.email}
                                </p>
                            </div>
                            {user.membership_expiry && (
                                <div className="mt-4 pt-4 border-t border-theme-purple/10">
                                    <p className="text-theme-text-muted text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-theme-purple/40"></span>
                                        Geldig tot: <span className="font-semibold text-theme-text">{new Date(user.membership_expiry).toLocaleDateString('nl-NL')}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-theme-text-light italic text-center">
                            Je hoeft op dit moment geen actie te ondernemen.
                        </p>
                    </div>
                )}

                {isExpired && (
                    <RenewalSection
                        baseAmount={baseAmount}
                        user={{
                            id: user.id,
                            first_name: user.first_name,
                            membership_expiry: user.membership_expiry,
                            email: user.email
                        }}
                    />
                )}

                {isGuest && (
                    <MembershipForm baseAmount={baseAmount} />
                )}

                {!isGuest && !isMember && !isExpired && (
                    <MembershipForm
                        baseAmount={baseAmount}
                        user={{
                            id: user.id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email,
                            phone_number: user.phone_number,
                            date_of_birth: user.date_of_birth
                        }}
                    />
                )}
            </section>

            <aside className="w-full sm:w-1/2 flex flex-col gap-6">
                <div className="w-full bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-theme-purple dark:text-theme-white mb-6 text-center">
                        Waarom lid worden?
                    </h2>

                    <div className="space-y-6">
                        {MEMBERSHIP_CONFIG.benefits.map((benefit, index) => (
                            <div key={index} className="flex gap-4 p-4 rounded-2xl bg-theme-purple/5 border border-theme-purple/10">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-theme-purple/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-theme-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-theme-purple text-lg leading-tight mb-1">{benefit.title}</h3>
                                    <p className="text-theme-text-subtle text-sm leading-relaxed">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-theme-purple/5 rounded-2xl border border-theme-purple/10 text-center">
                        <p className="text-theme-text-subtle text-sm italic">
                            {MEMBERSHIP_CONFIG.footer_text}
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
}

export default function MembershipPage() {
    return (
        <div className="min-h-screen">
            <PageHeader
                title="Lidmaatschap"
                backgroundImage="/img/backgrounds/homepage-banner.jpg"
                backgroundPosition="center 75%"
                contentPadding="py-20"
                variant="centered"
                titleClassName="text-theme-purple dark:text-theme-white text-3xl sm:text-4xl md:text-6xl drop-shadow-sm"
                description={
                    <p className="text-lg sm:text-xl text-theme-purple dark:text-theme-white max-w-3xl mt-4 font-medium drop-shadow-sm mx-auto">
                        Beheer je lidmaatschap bij Salve Mundi en profiteer van alle voordelen.
                    </p>
                }
            />

            <main className="max-w-app mx-auto">
                <Suspense fallback={<MembershipSkeleton />}>
                    <MembershipContent />
                </Suspense>
            </main>
        </div>
    );
}

