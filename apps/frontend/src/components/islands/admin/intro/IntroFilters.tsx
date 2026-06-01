'use client';

import { Search, Download, Users, Heart, FileText, Calendar } from 'lucide-react';

export type TabType = 'signups' | 'parents' | 'blogs' | 'planning';

interface IntroFiltersProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onExport: () => void;
    counts: Record<TabType, number>;
}

export default function IntroFilters({
    searchQuery,
    onSearchChange,
    activeTab,
    onTabChange,
    onExport,
    counts
}: IntroFiltersProps) {
    const tabs = [
        { id: 'signups', label: 'Aanmeldingen', count: counts.signups, icon: Users },
        { id: 'parents', label: 'Ouders', count: counts.parents, icon: Heart },
        { id: 'blogs', label: 'Blogs', count: counts.blogs, icon: FileText },
        { id: 'planning', label: 'Planning', count: counts.planning, icon: Calendar }
    ] as const;

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[var(--beheer-text-muted)]" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Zoek op naam of titel..."
                    className="block w-full pl-10 pr-3 py-2 border border-[var(--beheer-border)] rounded-xl leading-5 bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] placeholder-[var(--beheer-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all shadow-sm"
                />
            </div>

            <div className="flex bg-[var(--beheer-card-soft)] p-1 rounded-xl border border-[var(--beheer-border)]/50 overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as TabType)}
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-[var(--beheer-accent)] text-white shadow-sm'
                            : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-border)]/30'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className={`ml-1 text-[10px] py-0.5 px-1.5 rounded-full ${activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : 'bg-[var(--beheer-border)]/50 text-[var(--beheer-text)]'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {(activeTab === 'signups' || activeTab === 'parents') && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-xl text-sm font-semibold text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-colors shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4 text-[var(--beheer-text-muted)]" />
                        <span className="hidden sm:inline">Exporteer CSV</span>
                    </button>
                )}
            </div>
        </div>
    );
}