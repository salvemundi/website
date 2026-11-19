'use client';

import { Check, Compass } from 'lucide-react';
import { Box, Button, Card, Checkbox, Divider, Flex, Group, Paper, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import type { TripActivity } from '@salvemundi/validations/schema/beheer-trip.zod';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { parseActivityOptions } from '@/lib/reis';

export interface SelectedActivity {
    activityId: number;
    options: Record<string, boolean>;
}

interface ActivitySelectorProps {
    activities: TripActivity[];
    selectedSelections: SelectedActivity[];
    onChange: (selections: SelectedActivity[]) => void;
    hideHeader?: boolean;
}

export default function ActivitySelector({ activities, selectedSelections, onChange, hideHeader = false }: ActivitySelectorProps) {
    const handleToggleActivity = (activityId: number) => {
        const isSelected = selectedSelections.some(s => s.activityId === activityId);
        if (isSelected) {
            onChange(selectedSelections.filter(s => s.activityId !== activityId));
        } else {
            onChange([...selectedSelections, { activityId, options: {} }]);
        }
    };

    const handleOptionToggle = (activityId: number, optionId: string, maxSelections: number = 0) => {
        const selection = selectedSelections.find(s => s.activityId === activityId);
        if (!selection) return;

        const optionsMap = new Map(Object.entries(selection.options));
        const isAlreadySelected = optionsMap.has(optionId);

        if (isAlreadySelected) {
            optionsMap.delete(optionId);
        } else {
            if (maxSelections === 1) {
                optionsMap.clear();
            }
            optionsMap.set(optionId, true);
        }

        const newOptions = Object.fromEntries(optionsMap.entries());

        onChange(selectedSelections.map(s =>
            s.activityId === activityId ? { ...s, options: newOptions } : s
        ));
    };

    return (
        <Stack gap="lg">
            {!hideHeader && (
                <Stack gap={4}>
                    <Group gap="sm">
                        <Text span c="brand" lh={1}>
                            <Compass size={26} />
                        </Text>
                        <Title order={2} size="h2">
                            Optionele Activiteiten
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Kies de extra activiteiten die je wilt doen tijdens de reis.
                    </Text>
                    <Divider mt="sm" />
                </Stack>
            )}

            <Stack gap="md">
                {activities.map((activity) => {
                    const isSelected = selectedSelections.some(s => s.activityId === activity.id);
                    const selection = selectedSelections.find(s => s.activityId === activity.id);
                    const options = parseActivityOptions(activity.options);
                    const hasOptions = options.length > 0;

                    return (
                        <Card
                            key={activity.id}
                            padding={0}
                            radius="lg"
                            withBorder
                            shadow={isSelected ? 'md' : 'xs'}
                            style={{
                                overflow: 'hidden',
                                borderColor: isSelected ? 'var(--primary)' : undefined,
                                backgroundColor: isSelected ? 'color-mix(in srgb, var(--primary) 8%, var(--mantine-color-default))' : undefined,
                            }}
                        >
                            <Flex direction={{ base: 'column', md: 'row' }}>
                                {activity.image && (
                                    <Box
                                        pos="relative"
                                        w={{ base: '100%', md: 192 }}
                                        h={{ base: 192, md: 'auto' }}
                                        mih={160}
                                        bg="darkBase"
                                        style={{ flexShrink: 0, overflow: 'hidden' }}
                                    >
                                        <MediaAsset asset={activity.image} alt={activity.name} fill objectFit="contain" />
                                    </Box>
                                )}
                                <Group justify="space-between" align="center" wrap="wrap" gap="md" p="lg" style={{ flex: 1 }}>
                                    <Stack gap={4} style={{ flex: 1, minWidth: 200 }}>
                                        <Title order={4} size="h4">
                                            {activity.name}
                                        </Title>
                                        <Text size="sm" c="dimmed" maw={560}>
                                            {activity.description}
                                        </Text>
                                    </Stack>

                                    <Group gap="md" wrap="nowrap">
                                        {Number(activity.price) > 0 && (
                                            <Text size="md" fw={800} c="brand" style={{ whiteSpace: 'nowrap' }}>
                                                + €{Number(activity.price).toFixed(2)}
                                            </Text>
                                        )}
                                        <Button
                                            type="button"
                                            variant={isSelected ? 'filled' : 'light'}
                                            onClick={() => handleToggleActivity(activity.id)}
                                            leftSection={isSelected ? <Check size={16} /> : undefined}
                                        >
                                            {isSelected ? 'Geselecteerd' : 'Voeg toe'}
                                        </Button>
                                    </Group>
                                </Group>
                            </Flex>

                            {isSelected && hasOptions && (
                                <Box px="lg" pb="lg">
                                    <Divider mb="md" />
                                    <Text size="xs" fw={700} c="brand" tt="uppercase" mb="sm">
                                        Maak je keuze ({activity.max_selections === 1 ? 'één optie' : 'meerdere mogelijk'}):
                                    </Text>
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                                        {options.map((opt, idx) => {
                                            const optId = opt.id || `opt-${idx}`;
                                            const isOptSelected = selection?.options ? new Map(Object.entries(selection.options)).get(optId) === true : false;
                                            return (
                                                <UnstyledButton
                                                    key={optId}
                                                    type="button"
                                                    onClick={() => handleOptionToggle(activity.id, optId, activity.max_selections || 0)}
                                                    w="100%"
                                                >
                                                    <Paper
                                                        p="sm"
                                                        radius="md"
                                                        withBorder
                                                        style={{
                                                            borderColor: isOptSelected ? 'var(--primary)' : undefined,
                                                            backgroundColor: isOptSelected ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                                                        }}
                                                    >
                                                        <Group justify="space-between" wrap="nowrap" gap="sm">
                                                            <Checkbox
                                                                checked={isOptSelected}
                                                                readOnly
                                                                tabIndex={-1}
                                                                label={opt.name}
                                                                styles={{ input: { pointerEvents: 'none' }, label: { cursor: 'pointer' } }}
                                                            />
                                                            {opt.price && Number(opt.price) > 0 && (
                                                                <Text size="xs" fw={700} c="brand" style={{ whiteSpace: 'nowrap' }}>
                                                                    +€{Number(opt.price).toFixed(2)}
                                                                </Text>
                                                            )}
                                                        </Group>
                                                    </Paper>
                                                </UnstyledButton>
                                            );
                                        })}
                                    </SimpleGrid>
                                </Box>
                            )}
                        </Card>
                    );
                })}
            </Stack>

            {activities.length === 0 && (
                <Paper p="xl" radius="lg" withBorder ta="center" style={{ borderStyle: 'dashed' }}>
                    <Text c="dimmed">Geen optionele activiteiten beschikbaar.</Text>
                </Paper>
            )}
        </Stack>
    );
}
