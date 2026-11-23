'use client';

import { type CoboGuestBoard } from '@salvemundi/validations';
import { Button, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { CheckCircle2, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import CoboActivityBadge from './CoboActivityBadge';

interface Props {
    currentBoard: CoboGuestBoard | null;
    waitingCount: number;
    nextBoardName?: string | null;
    onStatusChange: (id: number, status: string, name: string) => void;
    onNext: () => void;
}

export default function CoboCurrentBoardCard({
    currentBoard,
    waitingCount,
    nextBoardName,
    onStatusChange,
    onNext
}: Props) {
    if (!currentBoard) {
        return (
            <Card withBorder padding="lg" ta="center">
                <Stack align="center" gap="sm">
                    <Stack gap={2}>
                        <Text size="md" fw={600}>Geen bestuur actief</Text>
                        <Text size="xs" c="dimmed">
                            Kies een bestuur uit de wachtrij of start de volgende.
                        </Text>
                    </Stack>
                    {waitingCount > 0 && (
                        <Button
                            type="button"
                            onClick={onNext}
                            rightSection={<ArrowRight size={16} />}
                        >
                            Start Volgende ({nextBoardName ?? 'Bestuur'})
                        </Button>
                    )}
                </Stack>
            </Card>
        );
    }

    return (
        <Card withBorder padding="lg" ta="center">
            <Stack align="center" gap="md">
                <Stack align="center" gap="xs" maw={576}>
                    <Title order={2} size="h2">
                        {currentBoard.board_name}
                    </Title>
                    <Group justify="center" gap="xs">
                        <CoboActivityBadge
                            type={currentBoard.activity_type}
                            custom={currentBoard.activity_custom}
                        />
                    </Group>
                </Stack>

                <SimpleGrid cols={{ base: 2, sm: waitingCount > 0 ? 4 : 3 }} spacing="xs" w="100%" maw={576}>
                    <Button
                        type="button"
                        onClick={() => onStatusChange(currentBoard.id, 'completed', currentBoard.board_name || 'Bestuur')}
                        leftSection={<CheckCircle2 size={16} />}
                    >
                        Klaar
                    </Button>

                    {waitingCount > 0 && (
                        <Button
                            type="button"
                            color="success"
                            onClick={onNext}
                            title="Volgende oproepen"
                            leftSection={<ArrowRight size={16} />}
                        >
                            Volgende
                        </Button>
                    )}

                    <Button
                        type="button"
                        onClick={() => onStatusChange(currentBoard.id, 'waiting', currentBoard.board_name || 'Bestuur')}
                        title="Terugzetten in de wachtrij"
                        leftSection={<RotateCcw size={16} />}
                    >
                        Terug
                    </Button>

                    <Button
                        type="button"
                        onClick={() => onStatusChange(currentBoard.id, 'late', currentBoard.board_name || 'Bestuur')}
                        title="Markeren als niet op tijd"
                        leftSection={<Clock size={16} />}
                    >
                        Niet op tijd
                    </Button>
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
