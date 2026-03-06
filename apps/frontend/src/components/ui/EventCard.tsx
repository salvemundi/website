import Link from 'next/link';

interface EventCardProps {
    title: string;
    category: string;
    date: string;
    href: string;
}

// UI-component voor een evenementenkaart in de EventsSection.
// Server Component — geen interactiviteit.
export function EventCard({ title, category, date, href }: EventCardProps) {
    return (
        <Link
            href={href}
            className="group flex flex-col gap-3 rounded-3xl bg-white/90 dark:bg-black/40 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
            {/* Categorie-label */}
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-purple-500)]">
                {category}
            </p>

            {/* Evenementtitel */}
            <h3 className="text-sm font-bold leading-snug text-[var(--color-purple-900)] dark:text-white group-hover:text-[var(--color-purple-600)] transition-colors line-clamp-2">
                {title}
            </h3>

            {/* Datum */}
            <p className="mt-auto text-xs font-medium text-[var(--color-purple-500)]/70 dark:text-white/60">
                {date}
            </p>
        </Link>
    );
}

// Skeleton versie van EventCard voor loading states
export function EventCardSkeleton() {
    return (
        <div className="flex flex-col gap-3 rounded-3xl bg-white/90 dark:bg-black/40 p-5 animate-pulse">
            <div className="h-3 w-20 rounded-full bg-[var(--color-purple-300)]/20" />
            <div className="h-4 w-full rounded-full bg-[var(--color-purple-300)]/20" />
            <div className="h-4 w-3/4 rounded-full bg-[var(--color-purple-300)]/20" />
            <div className="mt-auto h-3 w-24 rounded-full bg-[var(--color-purple-300)]/20" />
        </div>
    );
}
