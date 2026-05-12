'use client';

import React from 'react';
import { Users, ChevronRight, Shield } from 'lucide-react';

interface Group {
    id: string | number;
    name: string;
    description?: string | null;
    permissions_count?: number;
}

interface GroupSelectorProps {
    groups: Group[];
    selectedGroupId: string | number | null;
    onSelectGroup: (id: string | number) => void;
}

export default function GroupSelector({
    groups,
    selectedGroupId,
    onSelectGroup
}: GroupSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--beheer-text)] flex items-center gap-2">
                    <Users className="h-5 w-5 text-[var(--beheer-accent)]" />
                    Groepen
                </h2>
                <span className="text-base font-medium text-[var(--beheer-text-muted)]">
                    {groups.length} beschikbare groepen
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {groups.map((group) => {
                    const isActive = selectedGroupId === group.id;

                    return (
                        <button
                            key={group.id}
                            onClick={() => onSelectGroup(group.id)}
                            className={`flex items-center gap-4 p-5 rounded-[var(--beheer-radius)] border text-left transition-all ${isActive
                                    ? 'bg-[var(--beheer-accent)]/5 border-[var(--beheer-accent)] shadow-sm'
                                    : 'bg-[var(--beheer-card-bg)] border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/50'
                                }`}
                        >
                            <div className={`p-3 rounded-xl transition-colors ${isActive
                                    ? 'bg-[var(--beheer-accent)] text-white'
                                    : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)]'
                                }`}>
                                <Users className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-[var(--beheer-text)] truncate">
                                    {group.name}
                                </h3>
                                {group.description && (
                                    <p className="text-base text-[var(--beheer-text-muted)] truncate">
                                        {group.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {group.permissions_count !== undefined && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] text-sm font-bold text-[var(--beheer-text-muted)]">
                                        <Shield className="h-3.5 w-3.5" />
                                        <span>{group.permissions_count} permissies</span>
                                    </div>
                                )}
                                <ChevronRight className={`h-5 w-5 transition-transform ${isActive ? 'translate-x-1 text-[var(--beheer-accent)]' : 'text-[var(--beheer-border)]'
                                    }`} />
                            </div>
                        </button>
                    );
                })}

                {groups.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-[var(--beheer-border)] rounded-[var(--beheer-radius)]">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20 text-[var(--beheer-text-muted)]" />
                        <p className="text-base font-bold text-[var(--beheer-text-muted)]">
                            Geen groepen gevonden
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}