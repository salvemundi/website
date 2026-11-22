'use client';

import { useState } from 'react';
import {
    Calendar,
    Phone,
    Clock,
    Hash,
    Shield,
    Edit,
    Save,
    Award,
    User as UserIcon,
    Layers,
} from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Card,
    Grid,
    Group,
    Input,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    InfoRow,
    CommitteeCard,
    GroupCard,
    EmptyState,
    cleanName,
} from './LedenSharedComponents';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';
import { PhoneInput } from '@/shared/ui/PhoneInput';

interface Member {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    date_of_birth?: string | null;
    membership_expiry?: string | null;
    phone_number?: string | null;
    entra_id?: string | null;
}

interface CommitteeMembership {
    id: string;
    is_leader: boolean;
    committee_id: {
        id: string;
        name: string;
        is_visible: boolean;
        azure_group_id?: string | null;
    };
}

interface Props {
    member: Member;
    memberships: CommitteeMembership[];
    realCommittees: CommitteeMembership[];
    otherGroups: CommitteeMembership[];
    hasAccess: boolean;
    onUpdateProfile: (data: Partial<Member>) => Promise<boolean>;
}

function parseDutchDate(input: string): string | null {
    const trimmed = input.trim();
    const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (dmy) {
        const [, d, m, y] = dmy;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return ymd ? trimmed : null;
}

export default function MemberProfileTab({
    member,
    realCommittees,
    otherGroups,
    hasAccess,
    onUpdateProfile,
}: Props) {
    const { showToast } = useAdminToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Member>>({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        phone_number: member.phone_number || '',
        date_of_birth: member.date_of_birth || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const success = await onUpdateProfile(editData);
        if (success) {
            setIsEditing(false);
            showToast('Profiel succesvol bijgewerkt', 'success');
        } else {
            showToast('Opslaan mislukt', 'error');
        }
        setSaving(false);
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Onbekend';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) throw new Error('Invalid date');
            return new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(d);
        } catch (error) {
            safeConsoleError('[MemberProfileTab.tsx][MemberProfileTab] ', error);
            return 'Onbekend';
        }
    };

    return (
        <Grid gap="lg">
            <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card p="xl" shadow="sm">
                    <Stack gap="lg">
                        <Group justify="space-between">
                            <Text size="xs" fw={600} c="dimmed">
                                Gegevens
                            </Text>
                            {hasAccess && !isEditing && (
                                <ActionIcon
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    aria-label="Gegevens bewerken"
                                >
                                    <Edit size={16} />
                                </ActionIcon>
                            )}
                        </Group>

                        {isEditing ? (
                            <Stack gap="md">
                                <TextInput
                                    label="Voornaam"
                                    value={editData.first_name || ''}
                                    onChange={(e) =>
                                        setEditData((prev) => ({
                                            ...prev,
                                            first_name: e.target.value,
                                        }))
                                    }
                                />
                                <TextInput
                                    label="Achternaam"
                                    value={editData.last_name || ''}
                                    onChange={(e) =>
                                        setEditData((prev) => ({
                                            ...prev,
                                            last_name: e.target.value,
                                        }))
                                    }
                                />
                                <Input.Wrapper label="Telefoon">
                                    <Box mt={4}>
                                        <PhoneInput
                                            value={editData.phone_number || ''}
                                            onChange={(e) =>
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    phone_number: e.target.value,
                                                }))
                                            }
                                        />
                                    </Box>
                                </Input.Wrapper>
                                <DateInput
                                    label="Geboortedatum"
                                    value={editData.date_of_birth || null}
                                    onChange={(val) =>
                                        setEditData((prev) => ({
                                            ...prev,
                                            date_of_birth: val ?? '',
                                        }))
                                    }
                                    valueFormat="DD-MM-YYYY"
                                    dateParser={parseDutchDate}
                                    placeholder="dd-mm-jjjj"
                                    clearable
                                />
                                <Group gap="sm" pt="xs">
                                    <Button
                                        type="button"
                                        flex={1}
                                        loading={saving}
                                        leftSection={<Save size={16} />}
                                        onClick={() => {
                                            void handleSave();
                                        }}
                                    >
                                        Opslaan
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Annuleren
                                    </Button>
                                </Group>
                            </Stack>
                        ) : (
                            <Stack gap="lg">
                                <InfoRow
                                    icon={Calendar}
                                    label="Geboortedatum"
                                    value={formatDate(member.date_of_birth)}
                                />
                                <InfoRow
                                    icon={Phone}
                                    label="Telefoonnummer"
                                    value={member.phone_number || 'Geen'}
                                />
                                <InfoRow
                                    icon={Clock}
                                    label="Verloopdatum"
                                    value={formatDate(member.membership_expiry)}
                                />
                                <InfoRow
                                    icon={Hash}
                                    label="Persoons ID"
                                    value={member.id.substring(0, 8) + '...'}
                                />
                                {member.entra_id && (
                                    <InfoRow
                                        icon={Shield}
                                        label="Entra ID"
                                        value={member.entra_id.substring(0, 8) + '...'}
                                    />
                                )}
                            </Stack>
                        )}
                    </Stack>
                </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 8 }}>
                <Stack gap="lg">
                    <Card p="xl" shadow="sm">
                        <Stack gap="lg">
                            <Group gap="md">
                                <ThemeIcon size="lg" color="accent">
                                    <Award size={22} />
                                </ThemeIcon>
                                <Box>
                                    <Title order={3} size="h4">
                                        Commissies
                                    </Title>
                                    <Text size="xs" c="dimmed">
                                        Actieve rollen binnen Salve Mundi
                                    </Text>
                                </Box>
                            </Group>

                            {realCommittees.length > 0 ? (
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    {realCommittees.map((membership) => (
                                        <CommitteeCard
                                            key={membership.id}
                                            membership={membership}
                                            cleanName={cleanName}
                                        />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <EmptyState
                                    icon={UserIcon}
                                    message="Geen actieve commissie-lidmaatschappen"
                                />
                            )}
                        </Stack>
                    </Card>

                    <Card p="xl" shadow="sm">
                        <Stack gap="lg">
                            <Group gap="md">
                                <ThemeIcon size="lg">
                                    <Layers size={22} />
                                </ThemeIcon>
                                <Box>
                                    <Title order={3} size="h4">
                                        Teams & Groepen
                                    </Title>
                                    <Text size="xs" c="dimmed">
                                        Systeemgroepen en secundaire teams
                                    </Text>
                                </Box>
                            </Group>

                            {otherGroups.length > 0 ? (
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    {otherGroups.map((membership) => (
                                        <GroupCard
                                            key={membership.id}
                                            membership={membership}
                                            cleanName={cleanName}
                                        />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <EmptyState icon={Layers} message="Geen overige groepen gevonden" />
                            )}
                        </Stack>
                    </Card>
                </Stack>
            </Grid.Col>
        </Grid>
    );
}
