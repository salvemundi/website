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
    created_at: string;
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
            className={`flex flex-col justify-between rounded-2xl border p-5 shadow-md ring-1 transition-all ${
                isUnassigned
                    ? 'border-red-500/20 bg-red-500/5 ring-red-500/10 hover:border-red-500/30'
                    : `ring-(--border-color)/20 ${color.bg} ${color.border}`
            }`}
        >
            <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex items-center justify-center rounded-xl border border-current/10 p-2 ${
                                isUnassigned
                                    ? 'border-red-500/10 bg-red-500/10 text-red-600 dark:text-red-400'
                                    : color.badge
                            }`}
                        >
                            <Users className="size-4.5" />
                        </div>
                        <div>
                            <h3
                                className={`text-base leading-tight font-bold tracking-tight ${
                                    isUnassigned ? 'text-red-700 dark:text-red-400' : color.text
                                }`}
                            >
                                {groupName}
                            </h3>
                            <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-(--text-muted) uppercase">
                                {groupSignups.length} aanmeldingen
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                            isUnassigned
                                ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20'
                                : `${color.badge} ring-current/20`
                        }`}
                    >
                        {totalTickets} {totalTickets === 1 ? 'deelnemer' : 'deelnemers'}
                    </span>
                </div>

                {/* Participant list */}
                <div className="space-y-2 border-t border-(--border-color)/10 pt-2">
                    {/* Leaders first */}
                    {!isUnassigned && leadersList.length > 0 && (
                        <div className={leaderGridClass}>
                            {leadersList.map((leader, lIdx) => (
                                <div
                                    key={`leader-${lIdx}`}
                                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs shadow-sm ring-1 ring-amber-500/5"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Crown
                                            className="size-3.5 shrink-0 animate-bounce fill-amber-500/20 text-amber-500"
                                            style={{ animationDuration: '3s' }}
                                        />
                                        <div className="flex min-w-0 flex-col">
                                            <span
                                                className="max-w-32.5 truncate font-bold text-amber-700 sm:max-w-42.5 dark:text-amber-300"
                                                title={leader.name}
                                            >
                                                {leader.name}
                                            </span>
                                            <span className="text-[8px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
                                                Groepsleider {leader.signupId ? '' : '(Extern)'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveLeader?.(groupName, leader)}
                                        className="icon-button cursor-pointer rounded p-1 text-amber-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                                        title="Verwijder groepsleider"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {participantsList.length === 0 ? (
                        <p className="py-3 text-center text-xs text-(--text-muted) italic">
                            Geen deelnemers in deze groep
                        </p>
                    ) : (
                        <div className={listGridClass}>
                            {visibleParticipants.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-lg border border-(--border-color)/20 bg-(--bg-card)/60 px-3 py-2 text-xs transition-all hover:border-(--border-color)/40"
                                >
                                    <div className="flex min-w-0 flex-col">
                                        <span
                                            className="max-w-32.5 truncate font-semibold text-(--text-main) sm:max-w-42.5"
                                            title={p.name}
                                        >
                                            {p.name}
                                        </span>
                                        <span className="max-w-30 truncate text-[9px] text-(--text-muted)">
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
                                    className="col-span-full mt-2 beheer-button flex w-full items-center justify-center gap-1.5 rounded-lg border border-(--border-color)/40 bg-(--bg-main)/30 py-1.5 text-[10px] font-bold text-(--text-muted) transition-all hover:bg-(--bg-main)/60 hover:text-(--text-main)"
                                >
                                    {isExpanded ? (
                                        <>
                                            Toon minder <ChevronUp className="size-3" />
                                        </>
                                    ) : (
                                        <>
                                            Toon alle {regularParticipants.length} <ChevronDown className="size-3" />
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
                <div className="mt-4 border-t border-(--border-color)/10 pt-3">
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
                            className="beheer-button flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border border-(--border-color)/30 bg-(--bg-main)/30 py-1.5 text-[10px] font-bold text-(--text-muted) transition-all hover:border-(--theme-purple)/40 hover:bg-(--bg-main)/60 hover:text-(--theme-purple)"
                        >
                            <Plus className="size-3" /> Leider toevoegen
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
