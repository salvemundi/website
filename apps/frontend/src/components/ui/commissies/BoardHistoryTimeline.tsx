import { Card, Stack, Text } from '@mantine/core';
import { type Board } from '@salvemundi/validations/schema/board.zod';
import { BoardYearCard } from '@/components/ui/commissies/BoardYearCard';

interface BoardHistoryTimelineProps {
    boards: Board[];
}

export default function BoardHistoryTimeline({ boards }: BoardHistoryTimelineProps) {
    if (boards.length === 0) {
        return (
            <Card p="xl" ta="center">
                <Text c="dimmed" fs="italic">
                    Geen bestuursgeschiedenis gevonden.
                </Text>
            </Card>
        );
    }

    return (
        <Stack gap="xl">
            {boards.map((board) => (
                <BoardYearCard key={board.id} board={board} />
            ))}
        </Stack>
    );
}
