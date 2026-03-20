'use client';

import { Check, EyeOff } from 'lucide-react';

interface GroupSelectorProps {
    pageKey: string;
    selectedTokens: string[];
    allCommittees: any[];
    showAllGroups: boolean;
    onToggleToken: (pageKey: string, token: string) => void;
}

export default function GroupSelector({
    pageKey,
    selectedTokens,
    allCommittees,
    showAllGroups,
    onToggleToken
}: GroupSelectorProps) {
    const visibleGroups = allCommittees.filter(c => c.is_visible !== false);
    const hiddenGroups = allCommittees.filter(c => c.is_visible === false);
    const displayedGroups = showAllGroups ? allCommittees : visibleGroups;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Beschikbare Groepen</p>
                {!showAllGroups && hiddenGroups.length > 0 && (
                    <p className="text-[9px] text-[var(--text-light)] italic">
                        (+ {hiddenGroups.length} verborgen groepen)
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {displayedGroups.map(committee => {
                    const isSelected = selectedTokens.includes(committee.token);
                    const isHidden = !committee.is_visible;

                    return (
                        <button
                            key={committee.id}
                            onClick={() => onToggleToken(pageKey, committee.token)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 text-left ${
                                isSelected
                                ? 'bg-[var(--theme-purple)]/10 border-[var(--theme-purple)] text-[var(--theme-purple)] shadow-sm'
                                : isHidden
                                ? 'bg-[var(--bg-main)]/50 border-dashed border-[var(--border-color)]/50 text-[var(--text-light)]/50'
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-subtle)] hover:border-[var(--theme-purple)]/50 hover:text-[var(--text-main)]'
                            }`}
                        >
                            <span className="truncate pr-1" title={committee.name}>{committee.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                {isHidden && <EyeOff className="h-2.5 w-2.5 opacity-50" />}
                                {isSelected && <Check className="h-3 w-3" />}
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {displayedGroups.length === 0 && (
                <p className="text-center py-4 text-xs text-[var(--text-muted)] italic">
                    Geen groepen gevonden om weer te geven.
                </p>
            )}
        </div>
    );
}
