import { CalendarClock, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { Activiteit } from '@salvemundi/validations';
import { EventCard } from '@/components/ui/activities/EventCard';

interface EventsSectionProps {
    activiteiten: Activiteit[];
}

// Formatteert een ISO datetime string naar een leesbare Nederlandse datum.
function renderDate(dateStr: string): string {
    try {
        const parsed = new Date(dateStr);
        if (Number.isNaN(parsed.valueOf())) return dateStr;
        return parsed.toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return 'Datum volgt';
    }
}

// Server Component — toont de eerstvolgende activiteiten in een bg-gradient-theme wrapper.
// Layout 1:1 conform de legacy EventsSection (inclusief 4-koloms grid op lg).
export function EventsSection({ activiteiten }: EventsSectionProps) {
    return (
        <section id="kalender" className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 rounded-xl bg-gradient-theme px-6 sm:px-10 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pb-12 shadow-xl">

                    {/* Sectie-header */}
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--theme-purple)] dark:text-white">
                                <CalendarClock className="h-3 w-3" aria-hidden /> Agenda
                            </p>
                            <h2 className="text-3xl font-black text-[var(--theme-purple)] dark:text-white sm:text-4xl">
                                Aankomende evenementen
                            </h2>
                            <p className="max-w-xl text-sm text-[var(--text-muted)] dark:text-white/70">
                                Hier vind je een overzicht van al onze evenementen.
                            </p>
                        </div>
                        <Link
                            href="/activiteiten"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white dark:bg-white/10 px-5 py-2 text-sm font-semibold text-[var(--color-oranje)] shadow-sm transition hover:bg-[var(--color-oranje)]/5 dark:hover:bg-white/20"
                        >
                            <CalendarDays className="h-4 w-4" aria-hidden /> Alle activiteiten
                        </Link>
                    </div>

                    {/* Evenementenkaarten of lege staat */}
                    {activiteiten.length === 0 ? (
                        <div className="w-full rounded-3xl bg-white/90 dark:bg-black/40 p-10 flex items-center justify-center text-sm text-[var(--color-purple-700)] dark:text-white font-medium">
                            Nog geen aankomende evenementen. Check later opnieuw!
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {activiteiten.map((activiteit, index) => (
                                <div
                                    key={activiteit.id}
                                    className="stagger-item"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <EventCard
                                        title={activiteit.titel}
                                        category="Salve Mundi"
                                        date={renderDate(activiteit.datum_start)}
                                        href={`/activiteiten/${activiteit.id}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
