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
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center justify-between">
            {/* Tabs */}
            <div className="flex p-1 bg-(--beheer-card-soft) rounded-(--beheer-radius) border border-(--beheer-border) shadow-sm w-full lg:w-auto self-stretch lg:self-auto">
                <button
                    onClick={() => onTabChange('active')}
                    className={`flex-1 lg:flex-none px-6 py-2 rounded-[calc(var(--beheer-radius)-4px)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'active'
                        ? 'bg-(--beheer-accent) text-white shadow-sm'
                        : 'text-(--beheer-text-muted) hover:text-(--beheer-text) hover:bg-white/30 dark:hover:bg-white/5'
                        }`}
                >
                    <UserCheck className="h-4 w-4" />
                    Actief
                </button>
                <button
                    onClick={() => onTabChange('inactive')}
                    className={`flex-1 lg:flex-none px-6 py-2 rounded-[calc(var(--beheer-radius)-4px)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'inactive'
                        ? 'bg-(--beheer-accent) text-white shadow-sm'
                        : 'text-(--beheer-text-muted) hover:text-(--beheer-text) hover:bg-white/30 dark:hover:bg-white/5'
                        }`}
                >
                    <UserMinus className="h-4 w-4" />
                    Verlopen
                </button>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
                {/* Search Bar */}
                <div className="relative group flex-1 sm:w-72 shadow-sm rounded-(--beheer-radius)">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-20">
                        <Search className="h-4 w-4 text-(--beheer-text-muted) group-focus-within:text-(--beheer-accent) transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Zoek op naam of email..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-11 pr-10 py-2.5 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) text-(--beheer-text) placeholder:text-(--beheer-text-muted) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold text-xs shadow-sm"
                        suppressHydrationWarning
                        autoComplete="off"
                    />
                    {isPending && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-(--beheer-accent)" />}
                </div>

                {/* Export Button */}
                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text) rounded-(--beheer-radius) text-xs font-semibold hover:border-(--beheer-accent)/50 hover:bg-(--beheer-card-soft) transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                )}

                {/* Reminder Button */}
                {onReminder && (
                    <button
                        onClick={onReminder}
                        disabled={isSendingReminder}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-(--beheer-accent) text-white font-semibold text-xs rounded-(--beheer-radius) shadow-md hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                        {isSendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                        Herinnering
                    </button>
                )}
            </div>
        </div>
    );
}
