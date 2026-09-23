'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { type CoboGuestBoard } from '@salvemundi/validations';
import {
    addGuestBoardAction,
    updateGuestBoardStatusAction,
    reorderGuestBoardsAction,
    deleteGuestBoardAction
} from '@/server/actions/admin/cobo/admin-cobo-management.actions';
import { Users, CheckCircle2, Clock } from 'lucide-react';
import CoboAddBoardForm from './queue/CoboAddBoardForm';
import CoboCurrentBoardCard from './queue/CoboCurrentBoardCard';
import CoboWaitingList from './queue/CoboWaitingList';
import CoboArchivedList from './queue/CoboArchivedList';

interface Props {
    coboId: number;
    initialBoards: CoboGuestBoard[];
    initialTab?: TabType;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface LiveApiResponse {
    success: boolean;
    allBoards?: CoboGuestBoard[];
}

type TabType = 'queue' | 'completed' | 'late';

export default function CoboQueueManager({
    coboId,
    initialBoards,
    initialTab = 'queue',
    showToast
}: Props) {
    const [boards, setBoards] = useState<CoboGuestBoard[]>(initialBoards);
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [isPending, startTransition] = useTransition();

    const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isReorderingRef = useRef<boolean>(false);

    const handleSubTabChange = (tab: TabType) => {
        setActiveTab(tab);
        try {
            document.cookie = `cobo_admin_queue_subtab=${tab}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem('sm_admin_cobo_queue_subtab', tab);
        } catch {
        }
    };

    useEffect(() => {
        if (!isReorderingRef.current) {
            setBoards(initialBoards);
        }
    }, [initialBoards]);

    useEffect(() => {
        return () => {
            if (reorderTimeoutRef.current) {
                clearTimeout(reorderTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const fetchBoards = async () => {
            if (isReorderingRef.current) return;
            try {
                const res = await fetch(`/api/cobo/live?coboId=${coboId}`);
                if (res.ok) {
                    const data = (await res.json()) as LiveApiResponse;
                    if (data.allBoards) {
                        setBoards(data.allBoards);
                    }
                }
            } catch {
            }
        };

        const interval = setInterval(() => {
            void fetchBoards();
        }, 4000);

        return () => clearInterval(interval);
    }, [coboId]);

    const currentBoard = boards.find(b => b.status === 'current') || null;
    const waitingBoards = boards
        .filter(b => b.status === 'waiting')
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const completedBoards = boards.filter(b => b.status === 'completed');
    const lateBoards = boards.filter(b => b.status === 'late');

    const performReorder = (fromIndex: number, toIndex: number) => {
        if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= waitingBoards.length ||
            toIndex >= waitingBoards.length
        ) {
            return;
        }

        const updatedWaiting = [...waitingBoards];
        const [itemToMove] = updatedWaiting.splice(fromIndex, 1) as [CoboGuestBoard];
        updatedWaiting.splice(toIndex, 0, itemToMove);

        const reindexedWaiting = updatedWaiting.map((b, idx) => ({
            ...b,
            position: idx + 1
        }));

        const otherBoards = boards.filter(b => b.status !== 'waiting');
        const newBoards = [...otherBoards, ...reindexedWaiting];

        setBoards(newBoards);

        const newAllOrderedIds = [
            ...(currentBoard ? [currentBoard.id] : []),
            ...reindexedWaiting.map(b => b.id),
            ...lateBoards.map(b => b.id),
            ...completedBoards.map(b => b.id)
        ];

        isReorderingRef.current = true;
        if (reorderTimeoutRef.current) {
            clearTimeout(reorderTimeoutRef.current);
        }

        reorderTimeoutRef.current = setTimeout(() => {
            void (async () => {
                try {
                    await reorderGuestBoardsAction(coboId, newAllOrderedIds);
                } catch {
                    showToast('Fout bij opslaan van de nieuwe volgorde', 'error');
                } finally {
                    isReorderingRef.current = false;
                }
            })();
        }, 100);
    };

    const handleAddBoard = async (
        name: string,
        activityType: 'shotjes' | 'watervallen' | 'anders',
        activityCustom?: string
    ): Promise<boolean> => {
        try {
            const res = await addGuestBoardAction({
                cobo_id: coboId,
                board_name: name,
                activity_type: activityType,
                activity_custom: activityCustom
            });

            if (res.success) {
                setBoards(prev => [...prev, res.guestBoard]);
                showToast(`${name} toegevoegd aan de wachtrij!`, 'success');
                return true;
            } else {
                showToast(res.error || 'Toevoegen mislukt', 'error');
                return false;
            }
        } catch {
            showToast('Fout bij toevoegen', 'error');
            return false;
        }
    };

    const handleStatusChange = (id: number, newStatus: string, name: string) => {
        setBoards(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

        startTransition(async () => {
            try {
                const res = await updateGuestBoardStatusAction(id, newStatus);
                if (res.success) {
                    const label = newStatus === 'current' ? 'nu aan de beurt'
                        : newStatus === 'completed' ? 'afgerond'
                        : newStatus === 'late' ? 'gemarkeerd als te laat'
                        : 'terug in de wachtrij';
                    showToast(`${name} is ${label}!`, 'success');
                } else {
                    showToast(res.error || 'Status bijwerken mislukt', 'error');
                }
            } catch {
                showToast('Fout bij status wijzigen', 'error');
            }
        });
    };

    const handleNext = () => {
        if (!waitingBoards[0]) {
            showToast('Er zijn geen wachtende besturen meer.', 'info');
            return;
        }

        const nextBoard = waitingBoards[0];
        const prevBoard = currentBoard;

        setBoards(prev => prev.map(b => {
            if (prevBoard && b.id === prevBoard.id) return { ...b, status: 'completed' };
            if (b.id === nextBoard.id) return { ...b, status: 'current' };
            return b;
        }));

        startTransition(async () => {
            try {
                if (prevBoard) {
                    await updateGuestBoardStatusAction(prevBoard.id, 'completed');
                }
                await updateGuestBoardStatusAction(nextBoard.id, 'current');
                showToast(`${nextBoard.board_name} is nu aan de beurt!`, 'success');
            } catch {
                showToast('Fout bij oproepen volgende bestuur', 'error');
            }
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Weet je zeker dat je ${name} wilt verwijderen?`)) return;

        setBoards(prev => prev.filter(b => b.id !== id));

        startTransition(async () => {
            try {
                const res = await deleteGuestBoardAction(id);
                if (res.success) {
                    showToast(`${name} verwijderd`, 'info');
                } else {
                    showToast(res.error || 'Verwijderen mislukt', 'error');
                }
            } catch {
                showToast('Verwijderen mislukt', 'error');
            }
        });
    };

    return (
        <div className="space-y-6">
            <CoboAddBoardForm onAddBoard={handleAddBoard} isPending={isPending} />

            <CoboCurrentBoardCard
                currentBoard={currentBoard}
                waitingCount={waitingBoards.length}
                nextBoardName={waitingBoards[0]?.board_name}
                onStatusChange={handleStatusChange}
                onNext={handleNext}
            />

            <div className="flex items-center gap-2 overflow-x-auto border-b border-border-color pb-3">
                <button
                    type="button"
                    onClick={() => handleSubTabChange('queue')}
                    className={`tab-button flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:min-h-9 sm:text-sm ${
                        activeTab === 'queue'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'border border-border-color bg-bg-card text-text-muted hover:bg-bg-soft hover:text-text-main'
                    }`}
                >
                    <Users className="size-4" />
                    <span>Wachtrij ({waitingBoards.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSubTabChange('completed')}
                    className={`tab-button flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:min-h-9 sm:text-sm ${
                        activeTab === 'completed'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'border border-border-color bg-bg-card text-text-muted hover:bg-bg-soft hover:text-text-main'
                    }`}
                >
                    <CheckCircle2 className="size-4" />
                    <span>Geweest ({completedBoards.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSubTabChange('late')}
                    className={`tab-button flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:min-h-9 sm:text-sm ${
                        activeTab === 'late'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'border border-border-color bg-bg-card text-text-muted hover:bg-bg-soft hover:text-text-main'
                    }`}
                >
                    <Clock className="size-4" />
                    <span>Niet op tijd ({lateBoards.length})</span>
                </button>
            </div>

            {activeTab === 'queue' && (
                <CoboWaitingList
                    boards={waitingBoards}
                    onReorder={performReorder}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                />
            )}

            {activeTab === 'completed' && (
                <CoboArchivedList
                    type="completed"
                    boards={completedBoards}
                    onRestore={(id, name) => handleStatusChange(id, 'waiting', name)}
                />
            )}

            {activeTab === 'late' && (
                <CoboArchivedList
                    type="late"
                    boards={lateBoards}
                    onRestore={(id, name) => handleStatusChange(id, 'waiting', name)}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
