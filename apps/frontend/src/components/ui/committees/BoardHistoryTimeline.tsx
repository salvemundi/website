import { type Board } from '@salvemundi/validations/schema/board.zod';
import { BoardYearCard } from '@/components/ui/committees/BoardYearCard';

interface BoardHistoryTimelineProps {
    boards: Board[];
}

export default function BoardHistoryTimeline({ boards }: BoardHistoryTimelineProps) {
    if (boards.length === 0) {
        return (
            <div className="rounded-3xl bg-bg-card p-12 text-center shadow-lg dark:border dark:border-white/10">
                <p className="text-text-muted italic">Geen bestuursgeschiedenis gevonden.</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/0 via-purple-500/20 to-purple-500/0 hidden lg:block -translate-x-1/2" />

            <div className="space-y-16 lg:space-y-24">
                {boards.map((board) => (
                    <div key={board.id} className="relative">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-bg-main border-4 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.5)] z-10 hidden lg:block" />

                        <div className="relative z-20">
                            <BoardYearCard board={board} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}