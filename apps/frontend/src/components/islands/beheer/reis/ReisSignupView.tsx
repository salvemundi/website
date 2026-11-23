'use client';

import React from 'react';
import type { TripSignup } from '@salvemundi/validations';
import { formatShortDate } from '@/lib/utils/date-utils';
import {
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    AlertCircle,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    Bus,
    Briefcase,
} from 'lucide-react';
import {
    Alert,
    Badge,
    Box,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { safeConsoleError } from '@/server/utils/logger';

interface SignupViewProps {
    signup: TripSignup;
    isBusTrip?: boolean;
}

const formatFullDate = (d: Date) => {
    try {
        return new Intl.DateTimeFormat('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(d);
    } catch (error) {
        safeConsoleError('[SignupView.tsx][formatFullDate] ', error);
        return 'Onbekend';
    }
};

export default function SignupView({ signup, isBusTrip }: SignupViewProps) {
    const getStatusInfo = (status: string | null | undefined) => {
        switch (status) {
            case 'confirmed':
                return { icon: CheckCircle2, color: 'success', label: 'Bevestigd' };
            case 'waitlist':
                return { icon: Clock, color: 'accent', label: 'Wachtlijst' };
            case 'cancelled':
                return { icon: XCircle, color: 'error', label: 'Geannuleerd' };
            default:
                return { icon: AlertCircle, color: 'brand', label: 'Geregistreerd' };
        }
    };

    const statusInfo = getStatusInfo(signup.status);

    return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Stack gap="lg">
                <Stack gap="xs">
                    <Group gap="xs">
                        <Text span c="brand" lh={1}>
                            <User size={14} />
                        </Text>
                        <Title order={3} size="h6">
                            Reiziger
                        </Title>
                    </Group>
                    <Paper withBorder p="md">
                        <Stack gap={0}>
                            <ViewField
                                label="Naam"
                                value={`${signup.first_name} ${signup.last_name}`}
                                icon={User}
                            />
                            <Divider />
                            <ViewField label="Email" value={signup.email} icon={Mail} />
                            <Divider />
                            <ViewField
                                label="Telefoon"
                                value={signup.phone_number || 'Niet opgegeven'}
                                icon={Phone}
                            />
                            <Divider />
                            <ViewField
                                label="Geb. Datum"
                                value={
                                    signup.date_of_birth
                                        ? formatFullDate(new Date(signup.date_of_birth))
                                        : 'Niet opgegeven'
                                }
                                icon={Calendar}
                            />
                        </Stack>
                    </Paper>
                </Stack>

                <Stack gap="xs">
                    <Group gap="xs">
                        <Text span c="brand" lh={1}>
                            {isBusTrip ? <Bus size={14} /> : <FileText size={14} />}
                        </Text>
                        <Title order={3} size="h6">
                            {isBusTrip ? 'Vervoer' : 'Documenten'}
                        </Title>
                    </Group>
                    <Paper withBorder p="md">
                        {isBusTrip ? (
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <Bus size={14} />
                                    <Text size="xs" fw={600}>
                                        Chauffeur
                                    </Text>
                                </Group>
                                <Badge
                                    size="sm"
                                    color={signup.willing_to_drive ? 'success' : 'error'}
                                >
                                    {signup.willing_to_drive ? 'Beschikbaar' : 'Nee'}
                                </Badge>
                            </Group>
                        ) : (
                            <Stack gap={0}>
                                <ViewField
                                    label="ID Type"
                                    value={
                                        signup.id_document === 'passport'
                                            ? 'Paspoort'
                                            : signup.id_document === 'id_card'
                                              ? 'ID Kaart'
                                              : 'Niet opgegeven'
                                    }
                                    icon={FileText}
                                />
                                <Divider />
                                <ViewField
                                    label="ID Nummer"
                                    value={signup.document_number || 'Niet opgegeven'}
                                    icon={Briefcase}
                                />
                                <Divider />
                                <ViewField
                                    label="Vervaldatum"
                                    value={
                                        signup.document_expiry_date
                                            ? formatShortDate(new Date(signup.document_expiry_date))
                                            : 'Niet opgegeven'
                                    }
                                    icon={Calendar}
                                />
                                <Divider />
                                <ViewField
                                    label="Extra Koffer"
                                    value={signup.extra_luggage ? 'Ja' : 'Nee'}
                                    icon={Briefcase}
                                />
                            </Stack>
                        )}
                    </Paper>
                </Stack>
            </Stack>

            <Stack gap="lg">
                <Stack gap="xs">
                    <Group gap="xs">
                        <Text span c="brand" lh={1}>
                            <CreditCard size={14} />
                        </Text>
                        <Title order={3} size="h6">
                            Status
                        </Title>
                    </Group>
                    <Paper withBorder p="md">
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="xs" fw={600} c="dimmed">
                                    Status
                                </Text>
                                <Badge
                                    size="sm"
                                    color={statusInfo.color}
                                    leftSection={<statusInfo.icon size={12} />}
                                >
                                    {statusInfo.label}
                                </Badge>
                            </Group>
                            <Group justify="space-between">
                                <Text size="xs" fw={600} c="dimmed">
                                    Rol
                                </Text>
                                <Text size="xs" fw={600}>
                                    {signup.role === 'crew' ? 'Crew' : 'Reguliere Reiziger'}
                                </Text>
                            </Group>
                            <Divider />
                            <PaymentStatus
                                label="Aanbetaling"
                                isPaid={!!signup.deposit_paid}
                                date={signup.deposit_paid_at}
                            />
                            <PaymentStatus
                                label="Restbetaling"
                                isPaid={!!signup.full_payment_paid}
                                date={signup.full_payment_paid_at}
                            />
                        </Stack>
                    </Paper>
                </Stack>

                <Stack gap="xs">
                    <Group gap="xs">
                        <Text span c="brand" lh={1}>
                            <AlertCircle size={14} />
                        </Text>
                        <Title order={3} size="h6">
                            Notities
                        </Title>
                    </Group>
                    <Stack gap="xs">
                        <Alert color="error" title="Allergieën">
                            <Text size="xs">{signup.allergies || 'Geen'}</Text>
                        </Alert>
                        <Alert title="Bijzonderheden">
                            <Text size="xs">{signup.special_notes || 'Geen'}</Text>
                        </Alert>
                    </Stack>
                </Stack>
            </Stack>
        </SimpleGrid>
    );
}

function ViewField({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ size?: number }>;
}) {
    return (
        <Group justify="space-between" gap="md" py={8} wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
                <Text span c="dimmed" lh={1}>
                    <Icon size={13} />
                </Text>
                <Text size="xs" fw={600} c="dimmed">
                    {label}
                </Text>
            </Group>
            <Text size="xs" fw={600} truncate maw={200}>
                {value}
            </Text>
        </Group>
    );
}

function PaymentStatus({
    label,
    isPaid,
    date,
}: {
    label: string;
    isPaid: boolean;
    date?: string | null;
}) {
    return (
        <Group justify="space-between" align="flex-start">
            <Group gap="xs">
                <Box
                    w={6}
                    h={6}
                    style={{
                        borderRadius: '50%',
                        backgroundColor: isPaid ? 'var(--mantine-color-success-filled)' : 'var(--mantine-color-error-filled)',
                    }}
                />
                <Text size="xs" fw={600} c="dimmed">
                    {label}
                </Text>
            </Group>
            <Stack gap={2} align="flex-end">
                <Badge size="xs" color={isPaid ? 'success' : 'error'}>
                    {isPaid ? 'Betaald' : 'Niet betaald'}
                </Badge>
                {isPaid && date && (
                    <Text size="xs" c="dimmed">
                        {formatShortDate(new Date(date))}
                    </Text>
                )}
            </Stack>
        </Group>
    );
}
