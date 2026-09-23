import { type Board } from '@salvemundi/validations/schema/board.zod';
import { BoardYearCard } from '@/components/ui/commissies/BoardYearCard';

interface BoardHistoryTimelineProps {
    boards: Board[];
}

export default function BoardHistoryTimeline({ boards }: BoardHistoryTimelineProps) {
    if (boards.length === 0) {
        return (
            <div className="rounded-2xl bg-(--bg-card) p-8 text-center shadow-lg sm:rounded-3xl sm:p-12 dark:border dark:border-white/10">
                <p className="text-(--text-muted) italic">Geen bestuursgeschiedenis gevonden.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 sm:space-y-12 lg:space-y-16">
            {boards.map((board) => (
                <BoardYearCard key={board.id} board={board} />
            ))}
        </div>
    );
}