"use client";

import React from 'react';
import { Calendar1 } from '@/shared/ui/icons/Calendar1';

interface EventCardProps {
    title: string;
    category: string;
    date: string;
    tag?: 'competition' | 'show' | 'workshop' | 'social' | null;
}

const tagStyles = {
    competition: 'bg-theme-purple/10 text-theme-purple',
    show: 'bg-theme-purple-light/10 text-theme-purple-light',
    workshop: 'bg-theme-purple-dark/10 text-theme-purple-dark',
    social: 'bg-theme-purple-lighter/20 text-theme-purple',
};

export default function EventCard({ title, category, date, tag }: EventCardProps) {
    const [isHovering, setIsHovering] = React.useState(false);

    return (
        <article
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="group relative overflow-hidden rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
        >
            <span className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-theme-purple/20 transition duration-500 group-hover:scale-125" />

            <div className="relative space-y-3">
                {tag && (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tagStyles[tag] || 'bg-theme-purple/10 text-theme-purple'}`}>
                        {tag}
                    </span>
                )}

                <h3 className="text-lg font-bold text-theme line-clamp-2">{title}</h3>

                <p className="text-sm text-theme-muted">{category}</p>

                <div className="flex items-center gap-2 text-sm text-theme-purple">
                    <div className="h-4 w-4 text-theme-purple">
                        {/* pass external active flag as a special prop so Calendar1 starts when card hovered */}
                        <Calendar1 width={16} height={16} stroke="currentColor" strokeWidth={1.6} __active={isHovering} />
                    </div>
                    <span className="font-medium">{date}</span>
                </div>
            </div>
        </article>
    );
}
