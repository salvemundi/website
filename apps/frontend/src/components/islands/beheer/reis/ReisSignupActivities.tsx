'use client';

import React from 'react';
import { Utensils, Save } from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import type { TripActivity } from '@salvemundi/validations';

interface SignupActivitiesProps {
    allActivities: TripActivity[];
    selectedActivities: number[];
    onToggleActivity: (id: number) => void;
    onUpdate: () => void;
    isUpdating: boolean;
    hideButton?: boolean;
    minimal?: boolean;
}

export default function SignupActivities({
    allActivities,
    selectedActivities,
    onToggleActivity,
    onUpdate,
    isUpdating,
    hideButton = false,
    minimal = false,
}: SignupActivitiesProps) {
    const content = (
        <Stack gap="md">
            {!minimal && (
                <Group gap="md">
                    <ThemeIcon size={40} radius="md" variant="light" color="brand">
                        <Utensils size={20} />
                    </ThemeIcon>
                    <Box>
                        <Title order={2} size="h4">
                            Activiteiten
                        </Title>
                        <Text size="xs" c="dimmed">
                            Gekozen voor deze reis
                        </Text>
                    </Box>
                </Group>
            )}

            <Stack gap="xs">
                {allActivities.length === 0 ? (
                    <Paper withBorder py="lg" radius="md" style={{ borderStyle: 'dashed' }} ta="center">
                        <Text size="xs" fw={600} c="dimmed">
                            Geen activiteiten beschikbaar
                        </Text>
                    </Paper>
                ) : (
                    allActivities.map((activity) => {
                        const isSelected = selectedActivities.includes(activity.id as number);
                        return (
                            <Button
                                key={activity.id}
                                type="button"
                                variant={isSelected ? 'light' : 'default'}
                                color={isSelected ? 'brand' : undefined}
                                h="auto"
                                py="xs"
                                px="sm"
                                fullWidth
                                justify="space-between"
                                onClick={() => onToggleActivity(activity.id as number)}
                                leftSection={
                                    <Badge
                                        size="sm"
                                        variant={isSelected ? 'filled' : 'default'}
                                        color={isSelected ? 'brand' : undefined}
                                    >
                                        {activity.id}
                                    </Badge>
                                }
                                rightSection={
                                    <Checkbox
                                        checked={isSelected}
                                        readOnly
                                        size="sm"
                                        tabIndex={-1}
                                    />
                                }
                            >
                                <Stack gap={0} align="flex-start">
                                    <Text size="xs" fw={600}>
                                        {activity.name}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        €{Number(activity.price || 0).toFixed(2)}
                                    </Text>
                                </Stack>
                            </Button>
                        );
                    })
                )}
            </Stack>

            {!hideButton && (
                <Button
                    type="button"
                    variant="light"
                    color="brand"
                    fullWidth
                    size="md"
                    loading={isUpdating}
                    onClick={onUpdate}
                    leftSection={<Save size={18} />}
                >
                    Activiteiten Opslaan
                </Button>
            )}
        </Stack>
    );

    if (minimal) {
        return content;
    }

    return (
        <Card p="xl" shadow="sm">
            {content}
        </Card>
    );
}
