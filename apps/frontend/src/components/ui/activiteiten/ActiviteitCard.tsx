import React from 'react';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { Calendar, Tag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDateRange } from '@/shared/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface ActiviteitCardProps {
    activity?: Activiteit;
    title?: string;
    category?: string;
    date?: string;
    href?: string;
}

/**
 * UI Component voor een activiteit-kaart.
 */
export const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
    activity,
    title,
    category,
    date,
    href = "#"
}) => {
    // Gebruik props of activity
    const displayTitle = title || activity?.name;

    const rawCategory = category || (activity as (Activiteit & { category?: string }) | undefined)?.category || (activity as (Activiteit & { committee_name?: string }) | undefined)?.committee_name;
    const cleanCategory = (name?: string) => {
        if (!name || name === 'S.V. Salve Mundi') return 'S.V. Salve Mundi';
        return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || name;
    };
    const displayCategory = cleanCategory(rawCategory);

    const displayDate = date || formatDateRange(activity?.event_date, activity?.event_date_end);

    return (
        <Link
            href={href}
            className={cn(
                "squircle-lg group flex h-full flex-col gap-4 border border-(--border-color)/20 bg-white/95 p-6 shadow-sm backdrop-blur-md transition dark:bg-black/40 ",
                "hover:-translate-y-1.5 hover:border-purple-500/30 hover:shadow-xl"
            )}
        >
            <div className="flex items-center gap-2 text-[11px] font-black text-purple-500 dark:text-purple-300">
                <Tag className="size-4" />
                <span>{displayCategory}</span>
            </div>

            <h3 className={cn(
                "leading-1.1 line-clamp-2 text-2xl font-black text-(--text-main) transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-300"
            )}>
                {displayTitle}
            </h3>

            <div className="mt-auto flex items-center justify-between border-t border-(--border-color)/10 pt-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-(--text-muted) dark:text-white/60">
                    <Calendar className="size-4 text-purple-500" />
                    <span>{displayDate}</span>
                </div>

                <div className="flex size-7 items-center justify-center rounded-full bg-purple-500/5 text-purple-500 transition-all group-hover:bg-purple-500 group-hover:text-white">
                    <ChevronRight className="size-4" />
                </div>
            </div>
        </Link>
    );
};
