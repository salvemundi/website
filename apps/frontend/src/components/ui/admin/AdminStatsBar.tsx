import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatItem {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string;
}

interface AdminStatsBarProps {
    stats?: StatItem[];
    isLoading?: boolean;
}

/**
 * A standardized horizontal statistics bar for admin views.
 * Automatically handles a 4-column layout.
 */
export default function AdminStatsBar({ stats = [], isLoading = false }: AdminStatsBarProps) {
    const columnCount = isLoading && stats.length === 0 ? 4 : Math.min(stats.length, 5);
    const columnClass = {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
        5: 'lg:grid-cols-5',
    }[columnCount as 1 | 2 | 3 | 4 | 5] || 'lg:grid-cols-4';

    const items = isLoading && stats.length === 0 ? [
        { label: 'Totaal', value: '0000' },
        { label: 'Actief', value: '0000' },
        { label: 'Data', value: '0000' },
        { label: 'Usage', value: '0000' }
    ] : stats;

    return (
        <div 
            aria-busy={isLoading}
            className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 w-full",
                columnClass
            )}
        >
            {items.map((stat, i) => (
                <div 
                    key={i}
                    className={cn(
                        "bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-6 shadow-sm flex flex-col justify-between min-h-[120px] transition-all group",
                        !isLoading && "hover:border-[var(--beheer-accent)]/30"
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                            "text-xs font-black text-[var(--beheer-text-muted)] uppercase tracking-[0.2em] leading-tight pr-2",
                            isLoading && "ghost-item min-w-[60px]"
                        )}>
                            {isLoading ? "Label" : stat.label}
                        </span>
                        {stat.icon && (
                            <div className={cn(
                                "p-2 rounded-lg bg-[var(--beheer-accent)]/5 text-[var(--beheer-accent)] group-hover:bg-[var(--beheer-accent)] group-hover:text-white transition-all duration-300",
                                isLoading && "ghost-item"
                            )}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "text-2xl font-black text-[var(--beheer-text)] tracking-tighter leading-none",
                            isLoading && "ghost-item min-w-[40px]"
                        )}>
                            {isLoading ? "0000" : stat.value}
                        </span>
                        {stat.trend && (
                            <div className={cn(
                                "text-[9px] font-black text-[var(--beheer-active)] uppercase tracking-widest bg-[var(--beheer-active)]/10 px-1.5 py-0.5 rounded",
                                isLoading && "ghost-item"
                            )}>
                                {isLoading ? "Trend" : stat.trend}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
