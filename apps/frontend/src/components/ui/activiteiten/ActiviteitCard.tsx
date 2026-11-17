import React from 'react';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { Calendar, Tag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDateRange } from '@/shared/lib/utils/date';
import { Card } from '@/components/ui/card';

interface ActiviteitCardProps {
    activity?: Activiteit;
    title?: string;
    category?: string;
    date?: string;
    href?: string;
}

export const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
    activity,
    title,
    category,
    date,
    href = "#"
}) => {
    const displayTitle = title || activity?.name;

    const rawCategory = category || (activity as (Activiteit & { category?: string }) | undefined)?.category || (activity as (Activiteit & { committee_name?: string }) | undefined)?.committee_name;
    const cleanCategory = (name?: string) => {
        if (!name || name === 'S.V. Salve Mundi') return 'S.V. Salve Mundi';
        return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || name;
    };
    const displayCategory = cleanCategory(rawCategory);

    const displayDate = date || formatDateRange(activity?.event_date, activity?.event_date_end);

    return (
        <Link href={href} className="group block h-full">
            <Card className="flex h-full flex-col justify-between gap-4 p-6 transition-transform duration-200 hover:-translate-y-1">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Tag className="size-4" />
                        <span>{displayCategory}</span>
                    </div>

                    <h3 className="line-clamp-2 text-2xl font-black text-foreground transition-colors group-hover:text-primary">
                        {displayTitle}
                    </h3>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Calendar className="size-4 text-primary" />
                        <span>{displayDate}</span>
                    </div>

                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <ChevronRight className="size-4" />
                    </div>
                </div>
            </Card>
        </Link>
    );
};
