import { ClubCard } from '@/components/ui/clubs/ClubCard';
import { type Club } from '@salvemundi/validations/schema/clubs.zod';

interface ClubsListProps {
    initialClubs?: Club[];
}

export default function ClubsList({ initialClubs = [] }: ClubsListProps) {
    if (initialClubs.length === 0) {
        return (
            <div className="rounded-3xl bg-bg-card/80 dark:border dark:border-white/10 p-12 text-center shadow-lg">
                <p className="text-lg text-text-muted italic">Geen clubs gevonden.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {initialClubs.map((club, idx) => (
                <ClubCard key={club.id} club={club} index={idx} />
            ))}
        </div>
    );
}
