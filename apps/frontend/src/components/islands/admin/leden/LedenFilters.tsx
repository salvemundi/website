import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Loader2, UserCheck, UserMinus } from 'lucide-react';

interface LedenFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    activeTab: 'active' | 'inactive';
    onTabChange: (tab: 'active' | 'inactive') => void;
    isPending: boolean;
    isLoading?: boolean;
}

export default function LedenFilters({
    searchQuery,
    onSearchChange,
    activeTab,
    onTabChange,
    isPending,
    isLoading = false
}: LedenFiltersProps) {
    if (isLoading) {
        return (
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between animate-pulse">
                <div className="flex p-1 bg-[var(--beheer-card-soft)] rounded-xl w-full lg:w-auto border border-[var(--beheer-border)]">
                    <div className="h-10 w-28 bg-[var(--beheer-card-bg)] rounded-lg m-0.5" />
                    <div className="h-10 w-28 bg-transparent rounded-lg m-0.5" />
                </div>
                <div className="relative flex-1 lg:w-96">
                    <Skeleton className="w-full h-12 rounded-[var(--beheer-radius)]" />
                </div>
            </div>
        );
    }
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex p-1 bg-[var(--beheer-card-soft)] rounded-xl w-full lg:w-auto border border-[var(--beheer-border)]">
                <button
                    onClick={() => onTabChange('active')}
                    className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'active'
                        ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm ring-1 ring-[var(--beheer-border)]'
                        : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'
                        }`}
                >
                    <UserCheck className="h-3.5 w-3.5" />
                    Actief
                </button>
                <button
                    onClick={() => onTabChange('inactive')}
                    className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'inactive'
                        ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm ring-1 ring-[var(--beheer-border)]'
                        : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'
                        }`}
                >
                    <UserMinus className="h-3.5 w-3.5" />
                    Verlopen
                </button>
            </div>

            <div className="relative flex-1 lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors" />
                <input
                    type="text"
                    placeholder="Zoek op naam of email..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-11 pr-5 py-3 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-2 focus:ring-[var(--beheer-accent)]/20 focus:border-[var(--beheer-accent)] outline-none transition-all shadow-sm font-bold uppercase tracking-widest text-[10px]"
                    suppressHydrationWarning
                    autoComplete="off"
                />
                {isPending && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--beheer-accent)]" />}
            </div>
        </div>
    );
}
