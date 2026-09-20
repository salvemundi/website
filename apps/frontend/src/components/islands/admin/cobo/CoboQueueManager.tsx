'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { type CoboGuestBoard } from '@salvemundi/validations';
import {
    addGuestBoardAction,
    updateGuestBoardStatusAction,
    reorderGuestBoardsAction,
    deleteGuestBoardAction
} from '@/server/actions/admin/cobo/admin-cobo-management.actions';
import {
    Users,
    Plus,
    CheckCircle2,
    Clock,
    RotateCcw,
    Trash2,
    MoveUp,
    MoveDown,
    Loader2,
    Crown,
    Sparkles,
    ArrowRight,
    Flame,
    Waves,
    Edit3,
    GripVertical,
    ArrowUpToLine
} from 'lucide-react';

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

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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

    const [boardName, setBoardName] = useState('');
    const [activityType, setActivityType] = useState<'shotjes' | 'watervallen' | 'anders'>('shotjes');
    const [activityCustom, setActivityCustom] = useState('');
    const [isAdding, setIsAdding] = useState(false);

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
    const waitingBoards = boards.filter(b => b.status === 'waiting');
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

        const newAllOrderedIds = [
            ...(currentBoard ? [currentBoard.id] : []),
            ...updatedWaiting.map(b => b.id),
            ...lateBoards.map(b => b.id),
            ...completedBoards.map(b => b.id)
        ];

        setBoards(prev => {
            const posMap = new Map<number, number>();
            updatedWaiting.forEach((b, idx) => {
                posMap.set(b.id, idx + 1);
            });
            return prev.map(b => {
                const pos = posMap.get(b.id);
                return pos !== undefined ? { ...b, position: pos } : b;
            });
        });

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
                    setTimeout(() => {
                        isReorderingRef.current = false;
                    }, 1000);
                }
            })();
        }, 400);
    };

    const handleAddBoard = (e: React.FormEvent) => {
        e.preventDefault();
        if (!boardName.trim()) {
            showToast('Vul de naam van het gasten in', 'error');
            return;
        }

        setIsAdding(true);
        startTransition(async () => {
            try {
                const res = await addGuestBoardAction({
                    cobo_id: coboId,
                    board_name: boardName.trim(),
                    activity_type: activityType,
                    activity_custom: activityType === 'anders' ? activityCustom.trim() : undefined
                });

                if (res.success) {
                    setBoards(prev => [...prev, res.guestBoard]);
                    setBoardName('');
                    setActivityCustom('');
                    showToast(`${boardName} toegevoegd aan de wachtrij!`, 'success');
                } else {
                    showToast(res.error || 'Toevoegen mislukt', 'error');
                }
            } catch {
                showToast('Fout bij toevoegen', 'error');
            } finally {
                setIsAdding(false);
            }
        });
    };

    const handleStatusChange = (id: number, newStatus: string, name: string) => {
        startTransition(async () => {
            try {
                setBoards(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

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

        startTransition(async () => {
            try {
                if (currentBoard) {
                    await updateGuestBoardStatusAction(currentBoard.id, 'completed');
                }
                await updateGuestBoardStatusAction(waitingBoards[0].id, 'current');

                setBoards(prev => prev.map(b => {
                    if (currentBoard && b.id === currentBoard.id) return { ...b, status: 'completed' };
                    if (b.id === waitingBoards[0].id) return { ...b, status: 'current' };
                    return b;
                }));

                showToast(`${waitingBoards[0].board_name} is nu aan de beurt! 🎉`, 'success');
            } catch {
                showToast('Fout bij oproepen volgende bestuur', 'error');
            }
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Weet je zeker dat je ${name} wilt verwijderen?`)) return;

        startTransition(async () => {
            try {
                setBoards(prev => prev.filter(b => b.id !== id));
                const res = await deleteGuestBoardAction(id);
                if (res.success) {
                    showToast(`${name} verwijderd`, 'info');
                }
            } catch {
                showToast('Verwijderen mislukt', 'error');
            }
        });
    };

    const getActivityBadge = (type: string, custom?: string | null) => {
        switch (type) {
            case 'shotjes':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <Flame className="h-3.5 w-3.5 text-amber-500" />
                        <span>Shotjes</span>
                    </span>
                );
            case 'watervallen':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        <Waves className="h-3.5 w-3.5 text-blue-500" />
                        <span>Watervallen</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20" title={custom || undefined}>
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        <span>{custom || 'Anders'}</span>
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-bg-card rounded-2xl p-5 sm:p-6 border border-border-color shadow-sm">
                <h3 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-purple-500" />
                    Gasten Toevoegen
                </h3>

                <form onSubmit={handleAddBoard} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={boardName}
                            onChange={(e) => setBoardName(e.target.value)}
                            placeholder="Naam gasten / vereniging (bijv. sv Innovum)"
                            required
                            className="beheer-input flex-1 px-4 py-3 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-sm text-text-main font-medium"
                        />

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActivityType('shotjes')}
                                className={`beheer-button flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activityType === 'shotjes'
                                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                                        : 'bg-bg-soft border-border-color text-text-muted hover:border-amber-500/40'
                                }`}
                            >
                                <Flame className="h-3.5 w-3.5 text-amber-500" />
                                <span>Shotjes</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActivityType('watervallen')}
                                className={`beheer-button flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activityType === 'watervallen'
                                        ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                                        : 'bg-bg-soft border-border-color text-text-muted hover:border-blue-500/40'
                                }`}
                            >
                                <Waves className="h-3.5 w-3.5 text-blue-500" />
                                <span>Watervallen</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActivityType('anders')}
                                className={`beheer-button flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activityType === 'anders'
                                        ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                                        : 'bg-bg-soft border-border-color text-text-muted hover:border-purple-500/40'
                                }`}
                            >
                                <Edit3 className="h-3.5 w-3.5 text-purple-500" />
                                <span>Anders</span>
                            </button>
                        </div>
                    </div>

                    {activityType === 'anders' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <input
                                type="text"
                                value={activityCustom}
                                onChange={(e) => setActivityCustom(e.target.value)}
                                placeholder="Toelichting bij activiteit (bijv. Radje draaien, Brasopdracht, etc.)"
                                className="beheer-input w-full px-4 py-2.5 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-xs text-text-main font-medium"
                            />
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isAdding || isPending}
                            className="beheer-button w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            <span>Aan Wachtrij Toevoegen</span>
                        </button>
                    </div>
                </form>
            </div>

            {currentBoard ? (
                <div className="bg-linear-to-r from-purple-900/20 via-purple-600/10 to-transparent border-2 border-purple-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 animate-pulse shrink-0">
                                <Crown className="h-8 w-8" />
                            </div>
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500 text-white uppercase tracking-widest shadow-sm">
                                    <Sparkles className="h-3.5 w-3.5" /> Nu aan de beurt
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-black text-text-main mt-1.5 tracking-tight">
                                    {currentBoard.board_name}
                                </h2>
                                <div className="mt-2 flex items-center gap-3">
                                    {getActivityBadge(currentBoard.activity_type || 'shotjes', currentBoard.activity_custom)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => handleStatusChange(currentBoard.id, 'completed', currentBoard.board_name || 'Bestuur')}
                                className="beheer-button flex-1 md:flex-none px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <CheckCircle2 className="h-5 w-5" />
                                <span>Klaar</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleStatusChange(currentBoard.id, 'late', currentBoard.board_name || 'Bestuur')}
                                className="beheer-button flex-1 md:flex-none px-4 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Clock className="h-5 w-5" />
                                <span>Niet op tijd</span>
                            </button>

                            {waitingBoards.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    title="Volgende oproepen"
                                    className="beheer-button px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                >
                                    <span>Volgende</span>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-bg-card rounded-2xl p-6 border border-border-color shadow-sm flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 flex items-center justify-center font-black">
                            #
                        </div>
                        <div>
                            <p className="font-bold text-text-main text-sm">Er staat momenteel niemand op &apos;Nu aan de beurt&apos;</p>
                            <p className="text-xs text-text-muted">Kies een bestuur uit de wachtrij hieronder of klik op &apos;Volgende oproepen&apos;.</p>
                        </div>
                    </div>
                    {waitingBoards.length > 0 && (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="beheer-button px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Crown className="h-4 w-4" />
                            <span>Start Volgende ({waitingBoards[0]?.board_name ?? 'Bestuur'})</span>
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 border-b border-border-color pb-2 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => handleSubTabChange('queue')}
                    className={`tab-button px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'queue'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-text-muted hover:bg-bg-soft'
                    }`}
                >
                    <Users className="h-3.5 w-3.5" />
                    <span>Wachtrij ({waitingBoards.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSubTabChange('completed')}
                    className={`tab-button px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'completed'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-text-muted hover:bg-bg-soft'
                    }`}
                >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Geweest ({completedBoards.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSubTabChange('late')}
                    className={`tab-button px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'late'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-text-muted hover:bg-bg-soft'
                    }`}
                >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Niet op tijd ({lateBoards.length})</span>
                </button>
            </div>

            {activeTab === 'queue' && (
                <div className="space-y-3">
                    {waitingBoards.length === 0 ? (
                        <div className="p-8 text-center bg-bg-card rounded-2xl border border-border-color text-text-muted">
                            <p className="font-semibold text-sm">Geen wachtende besturen in de lijst.</p>
                            <p className="text-xs opacity-60 mt-1">Voeg hierboven een nieuw gasten toe.</p>
                        </div>
                    ) : (
                        waitingBoards.map((board, index) => {
                            const isDragged = draggedIndex === index;
                            const isDragOver = dragOverIndex === index && draggedIndex !== index;

                            return (
                                <div
                                    key={board.id}
                                    draggable
                                    onDragStart={(e) => {
                                        setDraggedIndex(index);
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (dragOverIndex !== index) {
                                            setDragOverIndex(index);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedIndex !== null && draggedIndex !== index) {
                                            performReorder(draggedIndex, index);
                                        }
                                        setDraggedIndex(null);
                                        setDragOverIndex(null);
                                    }}
                                    onDragEnd={() => {
                                        setDraggedIndex(null);
                                        setDragOverIndex(null);
                                    }}
                                    className={`bg-bg-card rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                                        isDragged
                                            ? 'opacity-40 border-purple-500 scale-[0.99]'
                                            : isDragOver
                                            ? 'border-purple-500 bg-purple-500/5 shadow-md -translate-y-0.5'
                                            : 'border-border-color shadow-sm hover:border-purple-500/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div
                                            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-purple-600 dark:hover:text-purple-400 p-1 -ml-1 rounded-md transition-colors shrink-0"
                                            title="Sleep om volgorde direct te wijzigen"
                                        >
                                            <GripVertical className="h-5 w-5" />
                                        </div>

                                        <div className="relative shrink-0" title="Klik om direct naar positie te springen">
                                            <select
                                                value={index + 1}
                                                onChange={(e) => {
                                                    const targetPos = parseInt(e.target.value, 10) - 1;
                                                    performReorder(index, targetPos);
                                                }}
                                                className="beheer-input appearance-none bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs h-8 px-2.5 rounded-lg border border-purple-500/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                                            >
                                                {waitingBoards.map((_, pIdx) => (
                                                    <option key={pIdx} value={pIdx + 1} className="bg-bg-card text-text-main font-semibold">
                                                        #{pIdx + 1}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-text-main text-base truncate">
                                                {board.board_name}
                                            </h4>
                                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                                {getActivityBadge(board.activity_type || 'shotjes', board.activity_custom)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => performReorder(index, 0)}
                                                title="Direct naar boven (#1)"
                                                className="beheer-button px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                            >
                                                <ArrowUpToLine className="h-3.5 w-3.5" />
                                                <span className="hidden md:inline">Naar #1</span>
                                            </button>
                                        )}

                                        <div className="flex items-center bg-bg-soft rounded-lg border border-border-color/60 p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => performReorder(index, index - 1)}
                                                disabled={index === 0}
                                                title="Eén plek omhoog"
                                                className="beheer-button p-1.5 hover:text-purple-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                            >
                                                <MoveUp className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => performReorder(index, index + 1)}
                                                disabled={index === waitingBoards.length - 1}
                                                title="Eén plek omlaag"
                                                className="beheer-button p-1.5 hover:text-purple-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                            >
                                                <MoveDown className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(board.id, 'current', board.board_name || 'Bestuur')}
                                            title="Nu aan de beurt zetten"
                                            className="beheer-button px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                        >
                                            <Crown className="h-3.5 w-3.5" />
                                            <span>Nu</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(board.id, 'late', board.board_name || 'Bestuur')}
                                            title="Markeren als niet op tijd"
                                            className="beheer-button p-2 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                        >
                                            <Clock className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(board.id, board.board_name || 'Bestuur')}
                                            title="Verwijderen"
                                            className="beheer-button p-2 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'completed' && (
                <div className="space-y-3">
                    {completedBoards.length === 0 ? (
                        <div className="p-8 text-center bg-bg-card rounded-2xl border border-border-color text-text-muted">
                            <p className="font-semibold text-sm">Nog geen besturen afgerond.</p>
                        </div>
                    ) : (
                        completedBoards.map((board) => (
                            <div
                                key={board.id}
                                className="bg-bg-card rounded-2xl p-4 border border-border-color shadow-sm flex items-center justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-text-main text-sm">{board.board_name}</h4>
                                        <span className="text-xs text-text-muted">Geweest</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleStatusChange(board.id, 'waiting', board.board_name || 'Bestuur')}
                                    className="beheer-button px-3 py-1.5 rounded-lg border border-border-color hover:border-purple-500 text-xs font-bold text-text-muted hover:text-purple-600 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>Herstel naar wachtrij</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'late' && (
                <div className="space-y-3">
                    {lateBoards.length === 0 ? (
                        <div className="p-8 text-center bg-bg-card rounded-2xl border border-border-color text-text-muted">
                            <p className="font-semibold text-sm">Geen besturen die niet op tijd waren.</p>
                        </div>
                    ) : (
                        lateBoards.map((board) => (
                            <div
                                key={board.id}
                                className="bg-bg-card rounded-2xl p-4 border border-amber-500/20 shadow-sm flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-text-main text-sm">{board.board_name}</h4>
                                        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Niet op tijd</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange(board.id, 'waiting', board.board_name || 'Bestuur')}
                                        className="beheer-button px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        <span>Terug in wachtrij</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(board.id, board.board_name || 'Bestuur')}
                                        className="beheer-button p-1.5 rounded-lg text-text-muted hover:text-rose-500 cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
