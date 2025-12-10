'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiWhatsAppGroups } from '@/shared/lib/hooks/useSalvemundiApi';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { stripHtml } from '@/shared/lib/text';
import { WhatsAppGroup } from '@/shared/lib/api/salvemundi';

export default function WhatsAppGroupsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { data: groups = [], isLoading: groupsLoading, error, refetch } = useSalvemundiWhatsAppGroups(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleJoinGroup = (inviteLink: string) => {
        window.open(inviteLink, '_blank', 'noopener,noreferrer');
    };

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center">
                <div className="text-paars text-xl font-semibold">Laden...</div>
            </div>
        );
    }

    // Extra check for membership status
    if (user.membership_status !== 'active') {
        return (
            <div className="">
                <PageHeader
                    title="WhatsApp Groepen"
                    backgroundImage="/img/backgrounds/whatsapp-banner.jpg" // Assuming a banner exists or use a default
                />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                            <div className="text-6xl mb-4">🔒</div>
                            <h1 className="text-3xl font-bold text-paars mb-4">Actief Lidmaatschap Vereist</h1>
                            <p className="text-paars/70 mb-6">
                                WhatsApp groepen zijn alleen beschikbaar voor leden met een actief lidmaatschap.
                                Vernieuw je lidmaatschap om toegang te krijgen tot deze groepen.
                            </p>
                            <button
                                onClick={() => router.push('/account')}
                                className="px-6 py-3 bg-gradient-to-r from-oranje to-paars text-white rounded-full font-semibold shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Terug naar Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            <PageHeader
                title="WhatsApp Groepen"
                backgroundImage="/img/backgrounds/whatsapp-banner.jpg" // Assuming a banner exists or use a default
            >
                <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                    Word lid van onze WhatsApp groepen om verbonden te blijven
                </p>
            </PageHeader>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/account')}
                            className="mb-4 flex items-center gap-2 text-paars hover:text-oranje transition-colors"
                        >
                            <span>←</span>
                            <span>Terug naar Account</span>
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-geel/20 rounded-2xl p-6 mb-8">
                        <div className="flex items-start gap-4">
                            <span className="text-3xl">ℹ️</span>
                            <div>
                                <h3 className="font-semibold text-paars mb-2">Over WhatsApp Groepen</h3>
                                <p className="text-paars/80 text-sm">
                                    Deze groepen zijn exclusief voor actieve leden. Klik op een groep om via WhatsApp lid te worden.
                                    Wees respectvol en volg de groepsregels.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Groups Section */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8">
                        {groupsLoading ? (
                            <div className="text-center py-12">
                                <div className="text-paars">WhatsApp groepen worden geladen...</div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="text-paars mb-4">Er is een fout opgetreden bij het laden van de groepen.</div>
                                <button
                                    onClick={() => refetch()}
                                    className="px-6 py-3 bg-gradient-to-r from-oranje to-paars text-white rounded-full font-semibold shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    Probeer Opnieuw
                                </button>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">💬</div>
                                <div className="text-paars mb-4 font-semibold">Momenteel geen WhatsApp groepen beschikbaar.</div>
                                <p className="text-paars/70 text-sm mb-4">
                                    Kom later terug voor nieuwe groepen om lid van te worden!
                                </p>
                                <div className="mt-6 p-4 bg-geel/10 rounded-xl max-w-md mx-auto">
                                    <p className="text-xs text-paars/60">
                                        💡 Let op: WhatsApp groepen worden binnenkort toegevoegd. Je kunt lid worden van groepen zodra deze door de beheerders zijn ingesteld.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {groups.map((group: WhatsAppGroup) => (
                                    <div
                                        key={group.id}
                                        className="p-6 rounded-2xl transition-all hover:shadow-lg"
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-full bg-geel flex items-center justify-center flex-shrink-0">
                                                <span className="text-3xl">💬</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-paars mb-2">
                                                    {group.name}
                                                </h3>
                                                {group.description && (
                                                    <p className="text-sm text-paars/70">
                                                        {stripHtml(group.description)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4">
                                            <div className="flex items-center gap-2 text-sm text-paars/70">
                                                <span className="px-2 py-1 bg-geel/30 rounded-full text-xs font-semibold">
                                                    Alleen Leden
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleJoinGroup(group.invite_link)}
                                                className="px-6 py-2 bg-gradient-to-r from-oranje to-paars text-white rounded-full font-semibold shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-2"
                                            >
                                                <span>Word Lid</span>
                                                <span>→</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="mt-8 bg-white rounded-2xl p-6">
                        <h3 className="font-semibold text-paars mb-3">Groepsregels</h3>
                        <ul className="space-y-2 text-sm text-[#1A1A3C]">
                            <li className="flex items-start gap-2">
                                <span className="text-geel mt-1">•</span>
                                <span className="text-[#1A1A3C]">Wees respectvol naar alle leden</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-geel mt-1">•</span>
                                <span className="text-[#1A1A3C]">Houd gesprekken relevant voor het groepsonderwerp</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-geel mt-1">•</span>
                                <span className="text-[#1A1A3C]">Geen spam of promotionele inhoud</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-geel mt-1">•</span>
                                <span className="text-[#1A1A3C]">
                                    Volg de{' '}
                                    <a
                                        href="https://salvemundi.nl/gedragscode"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-oranje underline hover:text-paars transition-colors font-semibold"
                                    >
                                        gedragscode van Salve Mundi
                                    </a>
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}
