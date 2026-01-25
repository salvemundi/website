'use client';


import PageHeader from '@/widgets/page-header/ui/PageHeader';
import Image from 'next/image';
import { useSalvemundiClubs } from '@/shared/lib/hooks/useSalvemundiApi';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { MessageSquare, Globe, Users } from 'lucide-react';
import { stripHtml } from '@/shared/lib/text';
import { CardSkeleton } from '@/shared/ui/skeletons';
import { useState } from 'react';
import Modal from '@/shared/ui/Modal';

export default function ClubsPage() {
    const { data: clubs = [], isLoading, error } = useSalvemundiClubs();
    const [selectedClub, setSelectedClub] = useState<any>(null);

    const sortedClubs = [...clubs].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
        <>
            <PageHeader
                title="CLUBS"
                backgroundImage="/img/backgrounds/clubs-banner.jpg"
            >
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-theme-purple dark:text-theme-white sm:text-xl font-medium drop-shadow-sm">
                    Ontdek student-clubs georganiseerd door en voor ICT-studenten
                </p>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-black text-theme-purple dark:text-theme-white sm:text-4xl">
                            Onze Clubs
                        </h2>
                        <p className="mt-2 text-theme-text/80 dark:text-theme-white/80">
                            Word lid van een van onze gezellige clubs en ontmoet mensen met dezelfde passies.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <CardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl bg-white/95 dark:bg-surface-dark/95 p-8 text-center shadow-lg">
                            <p className="mb-2 text-lg font-semibold text-theme-purple dark:text-theme-white">Fout bij laden van clubs</p>
                            <p className="text-sm text-theme-muted dark:text-theme-white/70">{String(error)}</p>
                        </div>
                    ) : sortedClubs.length === 0 ? (
                        <div className="rounded-3xl bg-white/95 dark:bg-surface-dark/95 p-8 text-center shadow-lg">
                            <p className="text-lg text-theme-purple dark:text-theme-white">Geen clubs gevonden</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 content-loaded">
                            {sortedClubs.map((club, index) => {
                                const description = stripHtml(club.description);
                                const isLongDescription = description.length > 150;

                                return (
                                    <article
                                        key={club.id}
                                        className="group flex flex-col overflow-hidden rounded-3xl bg-white/95 dark:bg-surface-dark/95 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl stagger-item"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-theme-purple/10 to-theme-purple/20">
                                            <Image
                                                src={getImageUrl(club.image)}
                                                alt={stripHtml(club.name) || 'Club'}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-contain object-center transition duration-700 group-hover:scale-105"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE5MiIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/img/placeholder.svg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 dark:from-white/20 dark:via-white/0 dark:to-white/0" />
                                        </div>

                                        <div className="flex flex-1 flex-col p-6">
                                            <h3 className="mb-3 text-2xl font-bold text-theme">
                                                {stripHtml(club.name)}
                                            </h3>
                                            <div className="mb-4 flex-1">
                                                <p className="text-sm leading-relaxed text-theme-muted line-clamp-3">
                                                    {description || 'Geen beschrijving beschikbaar'}
                                                </p>
                                                {isLongDescription && (
                                                    <button
                                                        onClick={() => setSelectedClub(club)}
                                                        className="mt-2 text-sm font-semibold text-theme-purple hover:underline"
                                                    >
                                                        Lees meer
                                                    </button>
                                                )}
                                            </div>

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
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Modal
                isOpen={!!selectedClub}
                onClose={() => setSelectedClub(null)}
                title={selectedClub ? stripHtml(selectedClub.name) : ''}
            >
                {selectedClub && stripHtml(selectedClub.description)}
            </Modal>
        </>
    );
}
