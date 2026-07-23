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
            <div className="flex items-center gap-3 grow max-w-md px-4 py-2 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-xl shadow-sm focus-within:border-(--beheer-accent) focus-within:ring-2 focus-within:ring-(--beheer-accent)/20 transition-all">
                <Search className="h-4 w-4 shrink-0 text-(--beheer-text-muted)" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Zoek op naam of titel..."
                    className="beheer-input bg-transparent text-(--beheer-text) placeholder:text-(--beheer-text-muted) outline-none border-none p-0 w-full font-semibold text-xs"
                    autoComplete="off"
                />
            </div>

            <div className="flex bg-(--beheer-card-soft) p-1 rounded-xl border border-(--beheer-border)/50 overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as TabType)}
                        className={`tab-button flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-(--beheer-accent) text-white shadow-sm'
                            : 'text-(--beheer-text-muted) hover:text-(--beheer-text) hover:bg-(--beheer-border)/30'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className={`ml-1 text-[10px] py-0.5 px-1.5 rounded-full ${activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : 'bg-(--beheer-border)/50 text-(--beheer-text)'
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
                        className="beheer-button flex items-center gap-2 px-4 py-2 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-xl text-sm font-semibold text-(--beheer-text) hover:bg-(--beheer-card-soft) transition-colors shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4 text-(--beheer-text-muted)" />
                        <span className="hidden sm:inline">Exporteer CSV</span>
                    </button>
                )}
            </div>
        </div>
    );
}