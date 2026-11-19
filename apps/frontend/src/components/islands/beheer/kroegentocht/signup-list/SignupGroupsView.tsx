'use client';

import { Box, SimpleGrid } from '@mantine/core';
import GroupCard, { type GroupAccentColor } from './GroupCard';
import { getParticipantNames } from '@/lib/utils/kroegentocht-signups';
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

const GROUP_COLORS: readonly GroupAccentColor[] = ['brand', 'accent', 'success'];

export function getSignupParticipants(
    signup: ExtendedSignup,
    _getParticipants?: (signup: ExtendedSignup) => Participant[]
) {
    return getParticipantNames(signup).map((name) => ({
        name,
        association: signup.association || '-',
        signupId: Number(signup.id),
    }));
}

export default function SignupGroupsView({
    filteredSignups,
    groupConfigs,
    groupNames,
    enabledGroups,
    onUpdateGroup,
    onAddLeader,
    onRemoveLeader,
    getParticipants,
}: SignupGroupsViewProps) {
    const hasUnassigned =
        enabledGroups.includes('unassigned') && filteredSignups.some((s) => !s.group_name);
    const visibleGroupsCount =
        groupConfigs.filter((g) => enabledGroups.includes(g.name)).length +
        (hasUnassigned ? 1 : 0);

    const cols =
        visibleGroupsCount === 1
            ? 1
            : visibleGroupsCount === 2
              ? { base: 1, lg: 2 }
              : { base: 1, md: 2, xl: 3 };

    const layoutColumns = visibleGroupsCount === 1 ? 3 : visibleGroupsCount === 2 ? 2 : 1;
    const maxWidth =
        visibleGroupsCount === 1 ? 896 : visibleGroupsCount === 2 ? 1152 : undefined;

    return (
        <Box maw={maxWidth} mx={maxWidth ? 'auto' : undefined} w="100%">
            <SimpleGrid cols={cols} spacing="lg">
                {groupConfigs
                    .filter((g) => enabledGroups.includes(g.name))
                    .map((groupConfig, groupIdx) => {
                        const groupName = groupConfig.name;
                        const groupSignups = filteredSignups.filter(
                            (s) => s.group_name === groupName
                        );
                        const totalTickets = groupSignups.reduce(
                            (sum, s) => sum + s.amount_tickets,
                            0
                        );
                        const color =
                            GROUP_COLORS.at(groupIdx % GROUP_COLORS.length) ?? 'brand';
                        const leadersList = groupConfig.leaders || [];

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

                {enabledGroups.includes('unassigned') &&
                    (() => {
                        const unassignedSignups = filteredSignups.filter((s) => !s.group_name);
                        if (unassignedSignups.length === 0) return null;

                        const totalTickets = unassignedSignups.reduce(
                            (sum, s) => sum + s.amount_tickets,
                            0
                        );
                        const participantsList = unassignedSignups.flatMap((s) =>
                            getSignupParticipants(s, getParticipants)
                        );

                        return (
                            <GroupCard
                                groupName="Niet ingedeeld"
                                groupSignups={unassignedSignups}
                                totalTickets={totalTickets}
                                participantsList={participantsList}
                                groupNames={groupNames}
                                onUpdateGroup={onUpdateGroup}
                                isUnassigned
                                color="error"
                                layoutColumns={layoutColumns}
                            />
                        );
                    })()}
            </SimpleGrid>
        </Box>
    );
}
