'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiWhatsAppGroups } from '@/shared/lib/hooks/useSalvemundiApi';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { stripHtml } from '@/shared/lib/text';
import { WhatsAppGroup } from '@/shared/lib/api/salvemundi';
import Card from '@/shared/ui/Card';

export default function WhatsAppGroupsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { data: groups = [], isLoading: groupsLoading, error, refetch } = useSalvemundiWhatsAppGroups(true);

    useEffect(() => {
        if (!authLoading && !user) {
            const returnTo = window.location.pathname + window.location.search;
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        }
    }, [user, authLoading, router]);

    const handleJoinGroup = (inviteLink: string) => {
        window.open(inviteLink, '_blank', 'noopener,noreferrer');
    };

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-theme-purple dark:text-theme-white text-xl font-semibold animate-pulse">Laden...</div>
            </div>
        );
    }

    // Extra check for membership status
    if (user.membership_status !== 'active') {
        return (
            <div className="">
                <PageHeader title="WhatsApp Groepen" />
                <main className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                    <div className="rounded-3xl bg-gradient-theme p-6 sm:p-8 lg:p-12 shadow-xl">
                        <div className="max-w-4xl mx-auto">
                            <Card variant="card" padding="p-8" className="text-center bg-white/95 dark:bg-surface-dark/95">
                                <div className="text-6xl mb-4">🔒</div>
                                <h1 className="text-3xl font-bold text-theme-purple dark:text-theme-white mb-4">Actief Lidmaatschap Vereist</h1>
                                <p className="text-theme-text-light dark:text-theme-text-light mb-6">
                                    WhatsApp groepen zijn alleen beschikbaar voor leden met een actief lidmaatschap.
                                    Vernieuw je lidmaatschap om toegang te krijgen tot deze groepen.
                                </p>
                                <button
                                    onClick={() => router.push('/account')}
                                    className="px-6 py-3 bg-gradient-theme text-theme-purple dark:text-theme-white rounded-full font-semibold shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    Terug naar Account
                                </button>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="">
            <PageHeader title="WhatsApp Groepen">
                <p className="text-lg sm:text-xl text-theme-purple dark:text-theme-white max-w-3xl mx-auto mt-4 font-medium drop-shadow-sm">
                    Word lid van onze WhatsApp groepen om verbonden te blijven
                </p>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/account')}
                            className="mb-4 flex items-center gap-2 text-theme-purple dark:text-theme-white hover:text-paars transition-colors font-semibold"
                        >
                            <span>←</span>
                            <span>Terug naar Account</span>
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-white/95 dark:bg-surface-dark/95 rounded-2xl p-6 mb-8 shadow-md">
                        <div className="flex items-start gap-4">
                            <span className="text-3xl">ℹ️</span>
                            <div>
                                <h3 className="font-semibold text-theme-purple dark:text-theme-white mb-2">Over WhatsApp Groepen</h3>
                                <p className="text-theme-text-muted dark:text-theme-text-muted text-sm">
                                    Deze groepen zijn exclusief voor actieve leden. Klik op een groep om via WhatsApp lid te worden.
                                    Wees respectvol en volg de groepsregels.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Groups Section */}
                    {groupsLoading ? (
                        <div className="text-center py-12 bg-white/95 dark:bg-surface-dark/95 rounded-3xl">
                            <div className="text-theme-purple dark:text-theme-white">WhatsApp groepen worden geladen...</div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 bg-white/95 dark:bg-surface-dark/95 rounded-3xl">
                            <div className="text-theme-purple dark:text-theme-white mb-4">Er is een fout opgetreden bij het laden van de groepen.</div>
                            <button
                                onClick={() => refetch()}
                                className="px-6 py-3 bg-gradient-theme text-theme-purple dark:text-theme-white rounded-full font-semibold shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Probeer Opnieuw
                            </button>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-12 bg-white/95 dark:bg-surface-dark/95 rounded-3xl">
                            <div className="text-6xl mb-4">💬</div>
                            <div className="text-theme-purple dark:text-theme-white mb-4 font-semibold">Momenteel geen WhatsApp groepen beschikbaar.</div>
                            <p className="text-theme-text-light dark:text-theme-text-light text-sm mb-4">
                                Kom later terug voor nieuwe groepen om lid van te worden!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.map((group: WhatsAppGroup) => (
                                <Card
                                    key={group.id}
                                    variant="card"
                                    className="bg-white/95 dark:bg-surface-dark/95 h-full"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-theme-purple/10 flex items-center justify-center flex-shrink-0 text-theme-purple dark:text-theme-white">
                                            <span className="text-3xl">💬</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-theme-purple dark:text-theme-white mb-2">
                                                {group.name}
                                            </h3>
                                            {group.description && (
                                                <p className="text-sm sm:text-base text-theme-text-muted dark:text-theme-text-muted leading-relaxed whitespace-pre-line break-words">
                                                    {stripHtml(group.description)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-theme-purple/10">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="px-2 py-1 bg-theme-purple/10 rounded-full text-xs font-semibold text-theme-purple dark:text-theme-white">
                                                Alleen Leden
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleJoinGroup(group.invite_link)}
                                            className="px-6 py-2 bg-gradient-theme text-theme-purple dark:text-theme-white rounded-full font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
                                        >
                                            <span>Word Lid</span>
                                            <span className="ml-2">→</span>
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Additional Info */}
                    <Card variant="card" className="mt-8 bg-white/95 dark:bg-surface-dark/95">
                        <h3 className="font-semibold text-theme-purple dark:text-theme-white mb-3 text-lg">Groepsregels</h3>
                        <ul className="space-y-3 text-sm text-theme-text-muted dark:text-theme-text-muted">
                            <li className="flex items-start gap-2">
                                <span className="text-theme-purple dark:text-theme-white mt-1">•</span>
                                <span>Wees respectvol naar alle leden</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-theme-purple dark:text-theme-white mt-1">•</span>
                                <span>Houd gesprekken relevant voor het groepsonderwerp</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-theme-purple dark:text-theme-white mt-1">•</span>
                                <span>Geen spam of promotionele inhoud</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-theme-purple dark:text-theme-white mt-1">•</span>
                                <span>
                                    Volg de{' '}
                                    <a
                                        href="https://salvemundi.nl/gedragscode"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-theme-purple dark:text-theme-white underline hover:opacity-80 transition-opacity font-semibold"
                                    >
                                        gedragscode van Salve Mundi
                                    </a>
                                </span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </main>
        </div>
    );
}
