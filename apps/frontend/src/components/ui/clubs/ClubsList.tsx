import { Card, SimpleGrid, Text } from '@mantine/core';
import { ClubCard } from '@/components/ui/clubs/ClubCard';
import { type Club } from '@salvemundi/validations/schema/clubs.zod';

interface ClubsListProps {
    initialClubs?: Club[];
    isActiveMember?: boolean;
}

export default function ClubsList({ initialClubs = [], isActiveMember = false }: ClubsListProps) {
    if (initialClubs.length === 0) {
        return (
            <Card p="xl" ta="center">
                <Text size="lg" c="dimmed" fs="italic">
                    Geen clubs gevonden.
                </Text>
            </Card>
        );
    }

    return (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg">
            {initialClubs.map((club, idx) => (
                <ClubCard key={club.id} club={club} index={idx} isActiveMember={isActiveMember} />
            ))}
        </SimpleGrid>
    );
}
