import { Search, Loader2, UserCheck, UserMinus, Download, Bell } from 'lucide-react';

interface LedenFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    activeTab: 'active' | 'inactive';
    onTabChange: (tab: 'active' | 'inactive') => void;
    isPending: boolean;
    onExport?: () => void;
    onReminder?: () => void;
    isSendingReminder?: boolean;
}

export default function LedenFilters({
    searchQuery,
    onSearchChange,
    activeTab,
    onTabChange,
    isPending,
    onExport,
    onReminder,
    isSendingReminder
}: LedenFiltersProps) {
    return (
        <div className="mb-8 flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
            {/* Tabs */}
            <div className="flex w-full self-stretch rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-soft) p-1 shadow-sm lg:w-auto lg:self-auto">
                <button
                    onClick={() => onTabChange('active')}
                    className={`tab-button flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[calc(var(--beheer-radius)-4px)] px-6 py-2 text-xs font-bold transition-all lg:flex-none ${activeTab === 'active'
                        ? 'bg-(--beheer-accent) text-white shadow-sm'
                        : 'text-(--beheer-text-muted) hover:bg-white/30 hover:text-(--beheer-text) dark:hover:bg-white/5'
                        }`}
                >
                    <UserCheck className="size-4" />
                    Actief
                </button>
                <button
                    onClick={() => onTabChange('inactive')}
                    className={`tab-button flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[calc(var(--beheer-radius)-4px)] px-6 py-2 text-xs font-bold transition-all lg:flex-none ${activeTab === 'inactive'
                        ? 'bg-(--beheer-accent) text-white shadow-sm'
                        : 'text-(--beheer-text-muted) hover:bg-white/30 hover:text-(--beheer-text) dark:hover:bg-white/5'
                        }`}
                >
                    <UserMinus className="size-4" />
                    Verlopen
                </button>
            </div>

            {/* Actions & Search */}
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:w-auto">
                {/* Search Bar */}
                <div className="flex flex-1 items-center gap-3 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 shadow-sm transition-all focus-within:border-(--beheer-accent) focus-within:ring-4 focus-within:ring-(--beheer-accent)/10 sm:w-72">
                    <Search className="size-4 shrink-0 text-(--beheer-text-muted)" />
                    <input
                        type="text"
                        placeholder="Zoek op naam of email..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="beheer-input w-full border-none bg-transparent p-0 text-xs font-semibold text-(--beheer-text) outline-none placeholder:text-(--beheer-text-muted)"
                        suppressHydrationWarning
                        autoComplete="off"
                    />
                    {isPending && <Loader2 className="size-4 shrink-0 animate-spin text-(--beheer-accent)" />}
                </div>

                {/* Export Button */}
                {onExport && (
                    <button
                        onClick={onExport}
                        className="beheer-button flex cursor-pointer items-center justify-center gap-2 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) px-5 py-2.5 text-xs font-semibold whitespace-nowrap text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 hover:bg-(--beheer-card-soft) active:scale-95 disabled:opacity-50"
                    >
                        <Download className="size-4" />
                        Export
                    </button>
                )}

                {/* Reminder Button */}
                {onReminder && (
                    <button
                        onClick={onReminder}
                        disabled={isSendingReminder}
                        className="beheer-button flex cursor-pointer items-center justify-center gap-2 rounded-(--beheer-radius) bg-(--beheer-accent) px-5 py-2.5 text-xs font-semibold whitespace-nowrap text-white shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50"
                    >
                        {isSendingReminder ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
                        Herinnering
                    </button>
                )}
            </div>
        </div>
    );
}
