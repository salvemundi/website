'use client';

import React from 'react';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations';
import { Users, Pen, Trash, Save, Ticket } from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Divider,
    Grid,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import ReisSignupForm from './ReisSignupForm';
import ReisSignupActivities from './ReisSignupActivities';
import ReisSignupView from './ReisSignupView';

interface AdminReisSignupModalIslandProps {
    isOpen: boolean;
    isEditing: boolean;
    isPending: boolean;
    selectedSignup: TripSignup | null;
    trip: Trip;
    allTripActivities: TripActivity[];
    selectedActivities: number[];
    sendingEmailTo: { signupId: number; type: string } | null;
    formRef: React.RefObject<HTMLFormElement | null>;
    onClose: () => void;
    onToggleEdit: () => void;
    onDelete: () => void;
    onSave: (formData: FormData) => void;
    onToggleActivity: (id: number) => void;
    onResendEmail: (signupId: number, type: 'deposit' | 'final') => void;
}

export default function BeheerReisSignupModalIsland({
    isOpen,
    isEditing,
    isPending,
    selectedSignup,
    trip,
    allTripActivities,
    selectedActivities,
    sendingEmailTo,
    formRef,
    onClose,
    onToggleEdit,
    onDelete,
    onSave,
    onToggleActivity,
    onResendEmail,
}: AdminReisSignupModalIslandProps) {
    if (!selectedSignup) return null;

    return (
        <Modal.Root
            opened={isOpen}
            onClose={onClose}
            size={isEditing ? '80rem' : 'lg'}
            centered
        >
            <Modal.Overlay />
            <Modal.Content>
                <Modal.Header>
                    <Modal.Title>
                        <Group gap="sm">
                            <ThemeIcon size="md">
                                {isEditing ? <Pen size={16} /> : <Users size={16} />}
                            </ThemeIcon>
                            <Text fw={700} size="sm">
                                {isEditing ? 'Deelnemer Bewerken' : 'Deelnemer Details'}
                            </Text>
                        </Group>
                    </Modal.Title>
                    <Group gap="xs" ml="auto">
                        <ActionIcon
                            type="button"
                            color="error"
                            size="lg"
                            onClick={onDelete}
                            disabled={isPending}
                            title="Verwijder Deelnemer"
                            aria-label="Verwijder Deelnemer"
                        >
                            {isPending ? <Loader size={16} /> : <Trash size={18} />}
                        </ActionIcon>
                        <Divider orientation="vertical" />
                        <ActionIcon
                            type="button"
                            variant={isEditing ? 'filled' : 'subtle'}
                            size="lg"
                            onClick={onToggleEdit}
                            title={isEditing ? 'Terug naar weergave' : 'Bewerken'}
                            aria-label={isEditing ? 'Terug naar weergave' : 'Bewerken'}
                        >
                            <Pen size={18} />
                        </ActionIcon>
                        <Modal.CloseButton />
                    </Group>
                </Modal.Header>

                <Modal.Body>
                    <Stack gap="lg">
                        {isEditing ? (
                            <Box component="form" ref={formRef} action={onSave}>
                                <TextInput display="none" name="id" value={String(selectedSignup.id)} readOnly />

                                <Grid gap="xl" align="flex-start">
                                    <Grid.Col span={{ base: 12, md: 6, xl: 4 }}>
                                        <ReisSignupForm
                                            signup={selectedSignup}
                                            isBusTrip={!!trip.is_bus_trip}
                                            minimal
                                            section="personal_basic"
                                            cockpit
                                        />
                                    </Grid.Col>

                                    <Grid.Col span={{ base: 12, md: 6, xl: 4 }}>
                                        <ReisSignupForm
                                            signup={selectedSignup}
                                            isBusTrip={!!trip.is_bus_trip}
                                            minimal
                                            section="personal_extended"
                                            cockpit
                                        />
                                    </Grid.Col>

                                    <Grid.Col span={{ base: 12, xl: 4 }}>
                                        <Stack gap="lg">
                                            <ReisSignupForm
                                                signup={selectedSignup}
                                                isBusTrip={!!trip.is_bus_trip}
                                                minimal
                                                section="admin"
                                                cockpit
                                            />

                                            <Divider />

                                            <Box>
                                                <Group gap="xs" mb="sm">
                                                    <Text span c="brand" lh={1}>
                                                        <Ticket size={14} />
                                                    </Text>
                                                    <Title order={3} size="h6">
                                                        Activiteiten
                                                    </Title>
                                                </Group>
                                                <ReisSignupActivities
                                                    allActivities={allTripActivities}
                                                    selectedActivities={selectedActivities}
                                                    onToggleActivity={onToggleActivity}
                                                    onUpdate={() => {}}
                                                    isUpdating={false}
                                                    hideButton
                                                    minimal
                                                />
                                            </Box>
                                        </Stack>
                                    </Grid.Col>
                                </Grid>
                            </Box>
                        ) : (
                            <ReisSignupView
                                signup={selectedSignup}
                                isBusTrip={!!trip.is_bus_trip}
                            />
                        )}

                        <Divider />

                        <Group justify="space-between" wrap="wrap" gap="sm">
                            <Button type="button" onClick={onClose}>
                                {isEditing ? 'Annuleren' : 'Sluiten'}
                            </Button>

                            {isEditing ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (formRef.current) formRef.current.requestSubmit();
                                    }}
                                    loading={isPending}
                                    leftSection={<Save size={16} />}
                                >
                                    Gegevens Opslaan
                                </Button>
                            ) : (
                                <Group gap="sm">
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant={
                                            selectedSignup.deposit_email_sent ? 'light' : 'filled'
                                        }
                                        color={
                                            selectedSignup.deposit_email_sent ? 'success' : 'brand'
                                        }
                                        onClick={() => onResendEmail(selectedSignup.id, 'deposit')}
                                        disabled={
                                            !!selectedSignup.deposit_paid ||
                                            (sendingEmailTo?.signupId === selectedSignup.id &&
                                                sendingEmailTo.type === 'deposit')
                                        }
                                    >
                                        Aanbetaling Mail
                                    </Button>
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant={
                                            selectedSignup.final_email_sent ? 'light' : 'filled'
                                        }
                                        color="success"
                                        onClick={() => onResendEmail(selectedSignup.id, 'final')}
                                        disabled={
                                            !!selectedSignup.full_payment_paid ||
                                            !trip.allow_final_payments ||
                                            (sendingEmailTo?.signupId === selectedSignup.id &&
                                                sendingEmailTo.type === 'final')
                                        }
                                    >
                                        Restbetaling Mail
                                    </Button>
                                </Group>
                            )}
                        </Group>
                    </Stack>
                </Modal.Body>
            </Modal.Content>
        </Modal.Root>
    );
}
