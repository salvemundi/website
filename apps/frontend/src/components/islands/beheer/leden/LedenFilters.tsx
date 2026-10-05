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
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Tabs */}
            <div className="flex w-full rounded-xl border border-beheer-border bg-beheer-card-soft p-1 lg:w-auto">
                <button
                    onClick={() => onTabChange('active')}
                    className={`tab-button ${activeTab === 'active'
                        ? 'bg-beheer-accent text-wit-paars'
                        : 'text-beheer-text-muted hover:text-beheer-text'
                        }`}
                    type="button">
                    <UserCheck className="size-4" />
                    Actief
                </button>
                <button
                    onClick={() => onTabChange('inactive')}
                    className={`tab-button ${activeTab === 'inactive'
                        ? 'bg-beheer-accent text-wit-paars'
                        : 'text-beheer-text-muted hover:text-beheer-text'
                        }`}
                    type="button">
                    <UserMinus className="size-4" />
                    Verlopen
                </button>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                {/* Search Bar */}
                <div className="search-bar flex-1 sm:w-72">
                    <Search className="size-4 shrink-0 text-beheer-text-muted" />
                    <input
                        type="text"
                        placeholder="Zoek op naam of email..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="beheer-input p-0"
                        suppressHydrationWarning
                        autoComplete="off"
                    />
                    {isPending && <Loader2 className="size-4 shrink-0 animate-spin text-beheer-accent" />}
                </div>

                {/* Export Button */}
                {onExport && (
                    <button
                        onClick={onExport}
                        className="beheer-button-secondary"
                        type="button">
                        <Download className="size-4" />
                        Export
                    </button>
                )}

                {/* Reminder Button */}
                {onReminder && (
                    <button
                        onClick={onReminder}
                        disabled={isSendingReminder}
                        className="beheer-button"
                        type="button">
                        {isSendingReminder ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
                        Herinnering
                    </button>
                )}
            </div>
        </div>
    );
}
