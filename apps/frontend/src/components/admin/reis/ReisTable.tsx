'use client';

import { AlertCircle } from 'lucide-react';
import { Center, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/trip.zod';
import ReisTableRow from './ReisTableRow';

interface ReisTableProps {
    filteredSignups: TripSignup[];
    selectedSignupId: number | null;
    onOpenSignup: (signup: TripSignup, edit?: boolean) => void;
    getStatusBadge: (status: string) => { label: string; color: string };
    getPaymentStatus: (signup: TripSignup) => { label: string; color: string };
    actionStates: { status: Set<number>; delete: Set<number> };
    sendingEmailTo: { signupId: number; type: string } | null;
    onStatusChange: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onResendEmail: (id: number, type: 'deposit' | 'final') => void;
    signupActivitiesMap: Record<number, TripSignupActivity[] | undefined>;
    allowFinalPayments: boolean;
    isBusTrip?: boolean;
}

export default function ReisTable({
    filteredSignups = [],
    selectedSignupId = null,
    onOpenSignup = () => { },
    getStatusBadge = () => ({ label: '', color: '' }),
    getPaymentStatus = () => ({ label: '', color: '' }),
    actionStates = { status: new Set(), delete: new Set() },
    sendingEmailTo = null,
    onStatusChange = () => { },
    onDelete = () => { },
    onResendEmail = () => { },
    signupActivitiesMap = {},
    allowFinalPayments = false,
    isBusTrip = false
}: ReisTableProps) {
    return (
        <Stack gap="sm">
            {filteredSignups.length === 0 ? (
                <Paper withBorder p="xl">
                    <Center py="xl">
                        <Stack align="center" gap="sm">
                            <AlertCircle size={48} opacity={0.25} />
                            <Text size="xs" fw={600} c="dimmed">
                                Geen aanmeldingen gevonden
                            </Text>
                        </Stack>
                    </Center>
                </Paper>
            ) : (
                <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
                    {filteredSignups.map(signup => (
                        <ReisTableRow
                            key={signup.id}
                            signup={signup}
                            isSelected={selectedSignupId === signup.id}
                            onSelect={onOpenSignup}
                            statusBadge={getStatusBadge(signup.status)}
                            paymentStatus={getPaymentStatus(signup)}
                            isStatusLoading={actionStates.status.has(signup.id)}
                            isDeleteLoading={actionStates.delete.has(signup.id)}
                            sendingEmailType={sendingEmailTo?.signupId === signup.id ? sendingEmailTo.type : null}
                            onStatusChange={onStatusChange}
                            onDelete={onDelete}
                            onResendEmail={onResendEmail}
                            activities={signupActivitiesMap[signup.id] || []}
                            allowFinalPayments={allowFinalPayments}
                            isBusTrip={isBusTrip}
                        />
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}
