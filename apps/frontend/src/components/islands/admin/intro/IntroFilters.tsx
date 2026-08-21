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
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
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
                            className="beheer-button flex items-center gap-2 px-4 py-2 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-xl text-sm font-semibold text-(--beheer-text) hover:bg-(--beheer-card-soft) transition-colors shadow-sm active:scale-95"
                        >
                            <Download className="w-4 h-4 text-(--beheer-text-muted)" />
                            <span className="hidden sm:inline">Exporteer CSV</span>
                        </button>
                    )}
                </div>
            </div>


            {/* Compact dropdown for narrow screens, where a full tab row doesn't fit */}
            <div className="lg:hidden">
                <div className="relative flex items-center gap-3 px-4 py-3 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-xl shadow-sm">
                    {activeTabInfo && <activeTabInfo.icon className="h-4 w-4 shrink-0 text-(--beheer-accent)" />}
                    <select
                        value={activeTab}
                        onChange={(e) => onTabChange(e.target.value as TabType)}
                        className="beheer-input bg-transparent text-(--beheer-text) outline-none border-none p-0 w-full font-semibold text-sm appearance-none"
                    >
                        {tabs.map(tab => (
                            <option key={tab.id} value={tab.id}>{tab.label} ({tab.count})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Full tab row, only shown once there's enough width for all labels */}
            <div className="hidden lg:flex bg-(--beheer-card-soft) p-1 rounded-xl border border-(--beheer-border)/50 overflow-x-auto">
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
                        {tab.label}
                        <span className={`ml-1 text-[10px] py-0.5 px-1.5 rounded-full ${activeTab === tab.id
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