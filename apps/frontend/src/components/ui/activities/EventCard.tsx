import React from 'react';
import { type Activity } from '@salvemundi/validations';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';
import { Skeleton } from '../Skeleton';
import Link from 'next/link';

interface EventCardProps {
    isLoading?: boolean;
    activity?: Activity;
    title?: string;
    category?: string;
    date?: string;
    href?: string;
}

/**
 * UI Component voor een evenement-kaart.
 * Hybride loading-state direct geïntegreerd om CLS te voorkomen.
 */
export const EventCard: React.FC<EventCardProps> = ({ 
    isLoading = false, 
    activity,
    title,
    category,
    date,
    href = "#"
}) => {
    // Gebruik props of activity
    const displayTitle = title || (activity as any)?.name || (activity as any)?.title || (activity as any)?.titel || 'Evenement';
    const displayCategory = category || 'Activiteit';
    const displayDate = date || ((activity as any)?.event_date || (activity as any)?.datum_start ? new Date((activity as any)?.event_date || (activity as any)?.datum_start).toLocaleDateString() : 'Binnenkort');

    // Skeleton-state: render exact dezelfde afmetingen
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-lg backdrop-blur-sm border border-[var(--border-color)]/10 h-full min-h-[160px]" aria-busy="true">
                <Skeleton className="h-3 w-16 bg-[var(--color-purple-500)]/20" rounded="full" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full bg-[var(--color-purple-500)]/10" rounded="md" />
                    <Skeleton className="h-5 w-2/3 bg-[var(--color-purple-500)]/10" rounded="md" />
                </div>
                <div className="mt-auto pt-4 flex gap-3">
                    <Skeleton className="h-3 w-20 bg-[var(--color-purple-500)]/10" rounded="full" />
                </div>
            </div>
        );
    }

    return (
        <Link 
            href={href}
            className="flex flex-col gap-3 rounded-3xl bg-white/90 dark:bg-black/40 p-5 shadow-sm border border-[var(--border-color)]/10 transition hover:-translate-y-1 hover:shadow-md group"
        >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-purple-500)]">
                <Tag className="h-3 w-3" />
                {displayCategory}
            </div>
            
            <h4 className="text-sm font-black leading-tight text-[var(--text-main)] group-hover:text-[var(--color-purple-500)] transition-colors line-clamp-2">
                {displayTitle}
            </h4>

            <div className="mt-auto pt-2 flex items-center gap-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {displayDate}
                </div>
            </div>
        </Link>
    );
};
