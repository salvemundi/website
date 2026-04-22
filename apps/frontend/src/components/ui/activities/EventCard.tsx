import React from 'react';
import { type Activity } from '@salvemundi/validations/schema/activity.zod';
import { Calendar, Tag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/shared/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface EventCardProps {
    activity?: Activity;
    title?: string;
    category?: string;
    date?: string;
    href?: string;
}

/**
 * UI Component voor een activiteit-kaart.
 */
export const EventCard: React.FC<EventCardProps> = ({
    activity,
    title,
    category,
    date,
    href = "#"
}) => {
    // Gebruik props of activity
    const displayTitle = title || (activity as any)?.titel;

    const rawCategory = category || (activity as any)?.category || (activity as any)?.committee_name;
    const cleanCategory = (name?: string) => {
        if (!name || name === 'S.V. Salve Mundi') return 'S.V. Salve Mundi';
        return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || name;
    };
    const displayCategory = cleanCategory(rawCategory);

    const displayDate = date || formatDate((activity as any)?.datum_start || new Date());

    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col gap-4 rounded-[2rem] bg-white/95 dark:bg-black/40 backdrop-blur-md p-6 shadow-sm border border-[var(--border-color)]/20 transition group h-full ",
                "hover:-translate-y-1.5 hover:shadow-xl hover:border-[var(--color-purple-500)]/30"
            )}
        >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-purple-500)] dark:text-[var(--color-purple-300)]">
                <Tag className="h-4 w-4" />
                <span>{displayCategory}</span>
            </div>

            <h3 className={cn(
                "text-2xl font-black leading-[1.1] text-[var(--text-main)] dark:text-white group-hover:text-[var(--color-purple-600)] dark:group-hover:text-[var(--color-purple-300)] transition-colors line-clamp-2"
            )}>
                {displayTitle}
            </h3>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-[var(--border-color)]/10">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] dark:text-white/60 uppercase tracking-widest">
                    <Calendar className="h-4 w-4 text-[var(--color-purple-500)]" />
                    <span>{displayDate}</span>
                </div>

                <div className="h-7 w-7 rounded-full bg-[var(--color-purple-500)]/5 flex items-center justify-center text-[var(--color-purple-500)] group-hover:bg-[var(--color-purple-500)] group-hover:text-white transition-all">
                    <ChevronRight className="h-4 w-4" />
                </div>
            </div>
        </Link>
    );
};
