'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Crown, Plus, Users, X } from 'lucide-react';
import GroupSelectDropdown from './GroupSelectDropdown';
import AddLeaderForm from './AddLeaderForm';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface Participant {
    name: string;
    initial: string;
}

interface ExtendedSignup extends PubCrawlSignup {
    participants?: Participant[];
    created_at?: string | Date;
}

interface GroupLeader {
    name: string;
    signupId?: number | null;
}

interface GroupCardProps {
    groupName: string;
    groupSignups: ExtendedSignup[];
    totalTickets: number;
    leadersList?: GroupLeader[];
    participantsList: { name: string; association: string; signupId: number }[];
    groupNames: string[];
    onUpdateGroup?: (signupId: number, newGroupName: string | null) => Promise<void>;
    onAddLeader?: (groupName: string, name: string, signupId: number | null) => void;
    onRemoveLeader?: (groupName: string, leader: GroupLeader) => void;
    color: {
        bg: string;
        border: string;
        text: string;
        badge: string;
    };
    isUnassigned?: boolean;
    layoutColumns?: number;
}

export default function GroupCard({
    groupName,
    groupSignups,
    totalTickets,
    leadersList = [],
    participantsList,
    groupNames,
    onUpdateGroup,
    onAddLeader,
    onRemoveLeader,
    color,
    isUnassigned = false,
    layoutColumns = 1
}: GroupCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAddLeaderForm, setShowAddLeaderForm] = useState(false);

    const regularParticipants = isUnassigned
        ? participantsList
        : participantsList.filter(
            (p) => !leadersList.some((l) => l.signupId === p.signupId && l.name.toLowerCase() === p.name.toLowerCase())
        );

    const limit = layoutColumns === 3 ? 12 : layoutColumns === 2 ? 8 : 5;
    const visibleParticipants = isExpanded ? regularParticipants : regularParticipants.slice(0, limit);

    const listGridClass = layoutColumns === 3
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
        : layoutColumns === 2
            ? "grid grid-cols-1 md:grid-cols-2 gap-2"
            : "space-y-2";

    const leaderGridClass = layoutColumns === 3
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3"
        : layoutColumns === 2
            ? "grid grid-cols-1 md:grid-cols-2 gap-2 mb-3"
            : "space-y-1.5 mb-3";

    return (
        <div
            className={`rounded-[var(--radius-2xl)] border shadow-md p-5 flex flex-col justify-between transition-all ring-1 ${
                isUnassigned
                    ? 'ring-red-500/10 border-red-500/20 hover:border-red-500/30 bg-red-500/5'
                    : `ring-[var(--border-color)]/20 ${color.bg} ${color.border}`
            }`}
        >
            <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-xl flex items-center justify-center border border-current/10 ${
                                isUnassigned
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10'
                                    : color.badge
                            }`}
                        >
                            <Users className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h3
                                className={`text-base font-bold tracking-tight leading-tight ${
                                    isUnassigned ? 'text-red-700 dark:text-red-400' : color.text
                                }`}
                            >
                                {groupName}
                            </h3>
                            <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5 tracking-wider uppercase">
                                {groupSignups.length} aanmeldingen
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ring-1 ${
                            isUnassigned
                                ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20'
                                : `${color.badge} ring-current/20`
                        }`}
                    >
                        {totalTickets} {totalTickets === 1 ? 'deelnemer' : 'deelnemers'}
                    </span>
                </div>

                {/* Participant list */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-color)]/10">
                    {/* Leaders first */}
                    {!isUnassigned && leadersList.length > 0 && (
                        <div className={leaderGridClass}>
                            {leadersList.map((leader, lIdx) => (
                                <div
                                    key={`leader-${lIdx}`}
                                    className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-xs ring-1 ring-amber-500/5 shadow-sm relative overflow-hidden group"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Crown
                                            className="h-3.5 w-3.5 text-amber-500 shrink-0 fill-amber-500/20 animate-bounce"
                                            style={{ animationDuration: '3s' }}
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span
                                                className="font-bold text-amber-700 dark:text-amber-300 truncate max-w-[130px] sm:max-w-[170px]"
                                                title={leader.name}
                                            >
                                                {leader.name}
                                            </span>
                                            <span className="text-[8px] text-amber-600 dark:text-amber-400 font-semibold tracking-wide uppercase">
                                                Groepsleider {leader.signupId ? '' : '(Extern)'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveLeader?.(groupName, leader)}
                                        className="p-1 rounded text-amber-600 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                        title="Verwijder groepsleider"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {participantsList.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic py-3 text-center">
                            Geen deelnemers in deze groep
                        </p>
                    ) : (
                        <div className={listGridClass}>
                            {visibleParticipants.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="flex justify-between items-center bg-[var(--bg-card)]/60 px-3 py-2 rounded-lg border border-[var(--border-color)]/20 hover:border-[var(--border-color)]/40 transition-all text-xs"
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span
                                            className="font-semibold text-[var(--text-main)] truncate max-w-[130px] sm:max-w-[170px]"
                                            title={p.name}
                                        >
                                            {p.name}
                                        </span>
                                        <span className="text-[9px] text-[var(--text-muted)] truncate max-w-[120px]">
                                            {p.association}
                                        </span>
                                    </div>

                                    {onUpdateGroup && (
                                        <GroupSelectDropdown
                                            value={isUnassigned ? '' : groupName}
                                            options={groupNames}
                                            onChange={(val) => {
                                                void onUpdateGroup(p.signupId, val);
                                            }}
                                            size="xs"
                                        />
                                    )}
                                </div>
                            ))}

                            {regularParticipants.length > limit && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-[var(--bg-main)]/30 hover:bg-[var(--bg-main)]/60 border border-[var(--border-color)]/40 rounded-lg text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all col-span-full mt-2"
                                >
                                    {isExpanded ? (
                                        <>
                                            Toon minder <ChevronUp className="h-3 w-3" />
                                        </>
                                    ) : (
                                        <>
                                            Toon alle {regularParticipants.length} <ChevronDown className="h-3 w-3" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Action to add a leader */}
            {!isUnassigned && onAddLeader && (
                <div className="mt-4 pt-3 border-t border-[var(--border-color)]/10">
                    {showAddLeaderForm ? (
                        <AddLeaderForm
                            participantsList={participantsList}
                            onAdd={(name, signupId) => {
                                onAddLeader(groupName, name, signupId);
                                setShowAddLeaderForm(false);
                            }}
                            onCancel={() => setShowAddLeaderForm(false)}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowAddLeaderForm(true)}
                            className="w-full py-1.5 flex items-center justify-center gap-1 bg-[var(--bg-main)]/30 hover:bg-[var(--bg-main)]/60 border border-[var(--border-color)]/30 hover:border-[var(--theme-purple)]/40 rounded-xl text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all cursor-pointer"
                        >
                            <Plus className="h-3 w-3" /> Leider toevoegen
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
