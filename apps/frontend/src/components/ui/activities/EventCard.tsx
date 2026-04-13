import React from 'react';
import { type Activity } from '@salvemundi/validations/schema/activity.zod';
import { Calendar, Tag } from 'lucide-react';
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
 * V7.12 SSR: Stripped of loading logic.
 */
export const EventCard: React.FC<EventCardProps> = ({ 
    activity,
    title,
    category,
    date,
    href = "#"
}) => {
    // Gebruik props of activity
    const displayTitle = title || (activity as any)?.name || (activity as any)?.title || (activity as any)?.titel;
    const displayCategory = category || 'Sector';
    const displayDate = date || formatDate((activity as any)?.event_date || (activity as any)?.datum_start || new Date());

    return (
        <Link 
            href={href}
            className={cn(
                "flex flex-col gap-3 rounded-3xl bg-white/90 dark:bg-black/40 p-5 shadow-sm border border-[var(--border-color)]/10 transition group h-full min-h-[180px]",
                "hover:-translate-y-1 hover:shadow-md"
            )}
        >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-purple-500)]">
                <Tag className="h-3.5 w-3.5" />
                <span>{displayCategory}</span>
            </div>
            
            {/* Tekstgrootte verhoogd naar text-lg en vaste hoogte geforceerd */}
            <h4 className={cn(
                "text-lg font-black leading-tight text-[var(--text-main)] group-hover:text-[var(--color-purple-500)] transition-colors line-clamp-2 min-h-[3rem]"
            )}>
                {displayTitle}
            </h4>

            <div className="mt-auto pt-2 flex items-center gap-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{displayDate}</span>
                </div>
            </div>
        </Link>
    );
};
