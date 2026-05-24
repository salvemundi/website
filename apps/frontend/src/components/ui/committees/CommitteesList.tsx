import { CommitteeCard } from '@/components/ui/committees/CommitteeCard';
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
            <div className="rounded-3xl bg-bg-card/80 dark:border dark:border-white/10 p-12 text-center shadow-lg">
                <p className="text-lg text-text-muted italic">Geen commissies gevonden.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sortedCommittees.map((committee, idx) => {
                const cleanedName = cleanCommitteeName(committee.name);
                const isBestuur = cleanedName.toLowerCase().includes('bestuur');

                return (
                    <div
                        key={committee.id}
                        className={`${isBestuur ? 'md:col-span-2' : ''} h-full`}
                    >
                        <CommitteeCard committee={committee} index={idx} />
                    </div>
                );
            })}
        </div>
    );
}