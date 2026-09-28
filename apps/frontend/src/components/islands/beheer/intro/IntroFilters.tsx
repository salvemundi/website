import { Download, Users, Heart, Calendar, ShieldCheck, Users2 } from 'lucide-react';
import IntroStudentSignupToggleIsland from './IntroStudentSignupToggleIsland';
import IntroParentSignupToggleIsland from './IntroParentSignupToggleIsland';

export type TabType = 'signups' | 'parents' | 'planning' | 'confidants' | 'groups';

interface IntroFiltersProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onExport: () => void;
    counts: Record<TabType, number>;
    studentSignupsOpen: boolean;
    parentSignupsOpen: boolean;
}

export default function IntroFilters({
    activeTab,
    onTabChange,
    onExport,
    counts,
    studentSignupsOpen,
    parentSignupsOpen
}: IntroFiltersProps) {
    const tabs = [
        { id: 'signups', label: 'Aanmeldingen', count: counts.signups, icon: Users },
        { id: 'parents', label: 'Ouders', count: counts.parents, icon: Heart },
        { id: 'planning', label: 'Planning', count: counts.planning, icon: Calendar },
        { id: 'confidants', label: 'Vertrouwenspersonen', count: counts.confidants, icon: ShieldCheck },
        { id: 'groups', label: 'Groepen', count: counts.groups, icon: Users2 }
    ] as const;

    const activeTabInfo = tabs.find(t => t.id === activeTab);

    return (
        <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    {activeTab === 'signups' && (
                        <IntroStudentSignupToggleIsland initialOpen={studentSignupsOpen} />
                    )}
                    {activeTab === 'parents' && (
                        <IntroParentSignupToggleIsland initialOpen={parentSignupsOpen} />
                    )}
                    {(activeTab === 'signups' || activeTab === 'parents') && (
                        <button
                            onClick={onExport}
                            className="beheer-button flex items-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2 text-sm font-semibold text-(--beheer-text) shadow-sm transition-colors hover:bg-(--beheer-card-soft) active:scale-95"
                        >
                            <Download className="size-4 text-(--beheer-text-muted)" />
                            <span className="hidden sm:inline">Exporteer CSV</span>
                        </button>
                    )}
                </div>
            </div>


            {/* Compact dropdown for narrow screens, where a full tab row doesn't fit */}
            <div className="lg:hidden">
                <div className="relative flex items-center gap-3 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-3 shadow-sm">
                    {activeTabInfo && <activeTabInfo.icon className="size-4 shrink-0 text-(--beheer-accent)" />}
                    <select
                        value={activeTab}
                        onChange={(e) => onTabChange(e.target.value as TabType)}
                        className="beheer-input w-full appearance-none border-none bg-transparent p-0 text-sm font-semibold text-(--beheer-text) outline-none"
                    >
                        {tabs.map(tab => (
                            <option key={tab.id} value={tab.id}>{tab.label} ({tab.count})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Full tab row, only shown once there's enough width for all labels */}
            <div className="hidden overflow-x-auto rounded-xl border border-(--beheer-border)/50 bg-(--beheer-card-soft) p-1 lg:flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as TabType)}
                        className={`tab-button flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-(--beheer-accent) text-white shadow-sm'
                            : 'text-(--beheer-text-muted) hover:bg-(--beheer-border)/30 hover:text-(--beheer-text)'
                            }`}
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : 'bg-(--beheer-border)/50 text-(--beheer-text)'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}