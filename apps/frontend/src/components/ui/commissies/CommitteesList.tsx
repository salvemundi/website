import { Card, Grid, GridCol, Text } from '@mantine/core';
import { CommitteeCard } from '@/components/ui/commissies/CommitteeCard';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';

interface CommitteesListProps {
    initialCommittees?: Committee[];
}

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

export default function CommitteesList({ initialCommittees = [] }: CommitteesListProps) {
    const sortedCommittees = [...initialCommittees].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');
        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    if (sortedCommittees.length === 0) {
        return (
            <Card p="xl" ta="center">
                <Text size="lg" c="dimmed" fs="italic">
                    Geen commissies gevonden.
                </Text>
            </Card>
        );
    }

    return (
        <Grid gap="lg">
            {sortedCommittees.map((committee, idx) => {
                const cleanedName = cleanCommitteeName(committee.name);
                const isBestuur = cleanedName.toLowerCase().includes('bestuur');

                return (
                    <GridCol
                        key={committee.id}
                        span={isBestuur ? { base: 12, md: 12, lg: 6 } : { base: 12, md: 6, lg: 3 }}
                    >
                        <CommitteeCard committee={committee} index={idx} />
                    </GridCol>
                );
            })}
        </Grid>
    );
}
