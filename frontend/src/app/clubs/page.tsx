'use client';


import PageHeader from '@/shared/components/ui/PageHeader';
import { useSalvemundiClubs } from '@/hooks/useSalvemundiApi';
import { getImageUrl } from '@/lib/api/salvemundi';
import { MessageSquare, Globe, Users } from 'lucide-react';

export default function ClubsPage() {
    const { data: clubs = [], isLoading, error } = useSalvemundiClubs();

    const sortedClubs = [...clubs].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
        <>
            <PageHeader
                title="CLUBS"
                backgroundImage="/img/backgrounds/clubs-banner.jpg"
            >
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90 sm:text-xl">
                    Ontdek student-clubs georganiseerd door en voor ICT-studenten
                </p>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                {isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-96 animate-pulse rounded-3xl bg-[var(--bg-card)]/60" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-3xl bg-[var(--bg-card)]/80 p-8 text-center shadow-lg">
                        <p className="mb-2 text-lg font-semibold text-theme-purple">Fout bij laden van clubs</p>
                        <p className="text-sm text-theme-muted">{String(error)}</p>
                    </div>
                ) : sortedClubs.length === 0 ? (
                    <div className="rounded-3xl bg-[var(--bg-card)]/80 p-8 text-center shadow-lg">
                        <p className="text-lg text-theme-muted">Geen clubs gevonden</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {sortedClubs.map((club) => (
                            <article
                                key={club.id}
                                className="group flex flex-col overflow-hidden rounded-3xl bg-[var(--bg-card)]/90 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                            >
                                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-theme-purple/10 to-theme-purple/20">
                                    <img
                                        src={getImageUrl(club.image)}
                                        alt={club.name || 'Club'}
                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/img/placeholder.svg';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
                                </div>

                                <div className="flex flex-1 flex-col p-6">
                                    <h3 className="mb-3 text-2xl font-bold text-theme">
                                        {club.name}
                                    </h3>
                                    <p className="mb-4 flex-1 text-sm leading-relaxed text-theme-muted line-clamp-3">
                                        {club.description || 'Geen beschrijving beschikbaar'}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {club.whatsapp_link && (
                                            <a
                                                href={club.whatsapp_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-theme-purple shadow-sm transition hover:bg-theme-purple/5"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                WhatsApp
                                            </a>
                                        )}
                                        {club.discord_link && (
                                            <a
                                                href={club.discord_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-theme-purple shadow-sm transition hover:bg-theme-purple/5"
                                            >
                                                <Users className="h-4 w-4" />
                                                Discord
                                            </a>
                                        )}
                                        {club.website_link && (
                                            <a
                                                href={club.website_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-theme-purple shadow-sm transition hover:bg-theme-purple/5"
                                            >
                                                <Globe className="h-4 w-4" />
                                                Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
