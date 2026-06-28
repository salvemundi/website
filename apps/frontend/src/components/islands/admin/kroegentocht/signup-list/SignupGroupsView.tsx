'use client';

import GroupCard from './GroupCard';
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

interface GroupConfig {
    name: string;
    leaders?: GroupLeader[];
}

interface SignupGroupsViewProps {
    filteredSignups: ExtendedSignup[];
    groupConfigs: GroupConfig[];
    groupNames: string[];
    enabledGroups: string[];
    onUpdateGroup?: (signupId: number, newGroupName: string | null) => Promise<void>;
    onAddLeader: (groupName: string, name: string, signupId: number | null) => void;
    onRemoveLeader: (groupName: string, leader: GroupLeader) => void;
    getParticipants: (signup: ExtendedSignup) => Participant[];
}

const GROUP_COLORS = [
    {
        bg: 'bg-purple-500/5 dark:bg-purple-400/5',
        border: 'border-purple-500/10 dark:border-purple-400/10 hover:border-purple-500/20',
        text: 'text-purple-700 dark:text-purple-300',
        badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-purple-500/20'
    },
    {
        bg: 'bg-blue-500/5 dark:bg-blue-400/5',
        border: 'border-blue-500/10 dark:border-blue-400/10 hover:border-blue-500/20',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20'
    },
    {
        bg: 'bg-emerald-500/5 dark:bg-emerald-400/5',
        border: 'border-emerald-500/10 dark:border-emerald-400/10 hover:border-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20'
    },
    {
        bg: 'bg-orange-500/5 dark:bg-orange-400/5',
        border: 'border-orange-500/10 dark:border-orange-400/10 hover:border-orange-500/20',
        text: 'text-orange-700 dark:text-orange-300',
        badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/20'
    },
    {
        bg: 'bg-rose-500/5 dark:bg-rose-400/5',
        border: 'border-rose-500/10 dark:border-rose-400/10 hover:border-rose-500/20',
        text: 'text-rose-700 dark:text-rose-300',
        badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20'
    },
    {
        bg: 'bg-pink-500/5 dark:bg-pink-400/5',
        border: 'border-pink-500/10 dark:border-pink-400/10 hover:border-pink-500/20',
        text: 'text-pink-700 dark:text-pink-300',
        badge: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 ring-pink-500/20'
    },
    {
        bg: 'bg-amber-500/5 dark:bg-amber-400/5',
        border: 'border-amber-500/10 dark:border-amber-400/10 hover:border-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20'
    },
    {
        bg: 'bg-indigo-500/5 dark:bg-indigo-400/5',
        border: 'border-indigo-500/10 dark:border-indigo-400/10 hover:border-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-300',
        badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-indigo-500/20'
    }
];

export function getSignupParticipants(
    signup: ExtendedSignup,
    getParticipants: (signup: ExtendedSignup) => Participant[]
) {
    const participantsList: { name: string; association: string; signupId: number }[] = [];
    const ps = getParticipants(signup);
    if (ps.length > 0) {
        ps.forEach((p) => {
            participantsList.push({
                name: `${p.name} ${p.initial}.`.trim(),
                association: signup.association || '-',
                signupId: Number(signup.id)
            });
        });
    } else {
        participantsList.push({
            name: signup.name,
            association: signup.association || '-',
            signupId: Number(signup.id)
        });
        for (let i = 1; i < signup.amount_tickets; i++) {
            participantsList.push({
                name: `Deelnemer ${i + 1} (${signup.name})`,
                association: signup.association || '-',
                signupId: Number(signup.id)
            });
        }
    }
    return participantsList;
}

export default function SignupGroupsView({
    filteredSignups,
    groupConfigs,
    groupNames,
    enabledGroups,
    onUpdateGroup,
    onAddLeader,
    onRemoveLeader,
    getParticipants
}: SignupGroupsViewProps) {
    const hasUnassigned = enabledGroups.includes('unassigned') && filteredSignups.some((s) => !s.group_name);
    const visibleGroupsCount = groupConfigs.filter((g) => enabledGroups.includes(g.name)).length + (hasUnassigned ? 1 : 0);

    let gridClass = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
    if (visibleGroupsCount === 1) {
        gridClass = "grid grid-cols-1 max-w-4xl mx-auto w-full gap-6";
    } else if (visibleGroupsCount === 2) {
        gridClass = "grid grid-cols-1 lg:grid-cols-2 max-w-6xl mx-auto w-full gap-6";
    }

    const layoutColumns = visibleGroupsCount === 1 ? 3 : visibleGroupsCount === 2 ? 2 : 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            <div className={gridClass}>
                {/* Render standard groups defined for the event */}
                {groupConfigs
                    .filter((g) => enabledGroups.includes(g.name))
                    .map((groupConfig, groupIdx) => {
                        const groupName = groupConfig.name;
                        const groupSignups = filteredSignups.filter((s) => s.group_name === groupName);
                        const totalTickets = groupSignups.reduce((sum, s) => sum + s.amount_tickets, 0);
                        const color = GROUP_COLORS[groupIdx % GROUP_COLORS.length];
                        const leadersList = groupConfig.leaders || [];

                        // Gather all individual participants
                        const participantsList = groupSignups.flatMap((s) =>
                            getSignupParticipants(s, getParticipants)
                        );

                        return (
                            <GroupCard
                                key={groupName}
                                groupName={groupName}
                                groupSignups={groupSignups}
                                totalTickets={totalTickets}
                                leadersList={leadersList}
                                participantsList={participantsList}
                                groupNames={groupNames}
                                onUpdateGroup={onUpdateGroup}
                                onAddLeader={onAddLeader}
                                onRemoveLeader={onRemoveLeader}
                                color={color}
                                layoutColumns={layoutColumns}
                            />
                        );
                    })}

                {/* Unassigned participants group (if any) */}
                {enabledGroups.includes('unassigned') &&
                    (() => {
                        const unassignedSignups = filteredSignups.filter((s) => !s.group_name);
                        if (unassignedSignups.length === 0) return null;

                        const totalTickets = unassignedSignups.reduce((sum, s) => sum + s.amount_tickets, 0);
                        const participantsList = unassignedSignups.flatMap((s) =>
                            getSignupParticipants(s, getParticipants)
                        );

                        // Render GroupCard for unassigned signups
                        return (
                            <GroupCard
                                groupName="Niet ingedeeld"
                                groupSignups={unassignedSignups}
                                totalTickets={totalTickets}
                                participantsList={participantsList}
                                groupNames={groupNames}
                                onUpdateGroup={onUpdateGroup}
                                isUnassigned
                                color={{
                                    bg: 'bg-red-500/5',
                                    border: 'border-red-500/20 hover:border-red-500/30',
                                    text: 'text-red-700 dark:text-red-400',
                                    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20'
                                }}
                                layoutColumns={layoutColumns}
                            />
                        );
                    })()}
            </div>
        </div>
    );
}
