'use client';

import React, { useState } from 'react';
import { Plus, Flame, Waves, Edit3, Loader2 } from 'lucide-react';

interface Props {
    onAddBoard: (
        boardName: string,
        activityType: 'shotjes' | 'watervallen' | 'anders',
        activityCustom?: string
    ) => Promise<boolean>;
    isPending?: boolean;
}

export default function CoboAddBoardForm({ onAddBoard, isPending = false }: Props) {
    const [boardName, setBoardName] = useState('');
    const [activityType, setActivityType] = useState<'shotjes' | 'watervallen' | 'anders'>('shotjes');
    const [activityCustom, setActivityCustom] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boardName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const success = await onAddBoard(
                boardName.trim(),
                activityType,
                activityType === 'anders' ? activityCustom.trim() : undefined
            );

            if (success) {
                setBoardName('');
                setActivityCustom('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-border-color bg-bg-card p-5 shadow-xs sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-text-main">
                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300">
                    <Plus className="size-4" />
                </div>
                <span>Gasten Toevoegen</span>
            </h3>

            <form
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
                className="space-y-4"
            >
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        value={boardName}
                        onChange={(e) => setBoardName(e.target.value)}
                        placeholder="Naam gasten / vereniging (bijv. sv Innovum)"
                        required
                        className="beheer-input flex-1 rounded-xl border border-border-color bg-bg-soft px-4 py-3 text-sm font-medium text-text-main focus:border-theme-purple focus:outline-none"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActivityType('shotjes')}
                            className={`beheer-button flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors sm:flex-none ${
                                activityType === 'shotjes'
                                    ? 'border-amber-500 bg-amber-500/15 text-amber-700 shadow-xs dark:text-amber-300'
                                    : 'border-border-color bg-bg-soft text-text-muted hover:border-amber-500/40'
                            }`}
                        >
                            <Flame className="size-3.5 text-amber-500" />
                            <span>Shotjes</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActivityType('watervallen')}
                            className={`beheer-button flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors sm:flex-none ${
                                activityType === 'watervallen'
                                    ? 'border-blue-500 bg-blue-500/15 text-blue-700 shadow-xs dark:text-blue-300'
                                    : 'border-border-color bg-bg-soft text-text-muted hover:border-blue-500/40'
                            }`}
                        >
                            <Waves className="size-3.5 text-blue-500" />
                            <span>Watervallen</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActivityType('anders')}
                            className={`beheer-button flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors sm:flex-none ${
                                activityType === 'anders'
                                    ? 'border-purple-500 bg-purple-500/15 text-purple-700 shadow-xs dark:text-purple-300'
                                    : 'border-border-color bg-bg-soft text-text-muted hover:border-purple-500/40'
                            }`}
                        >
                            <Edit3 className="size-3.5 text-purple-500" />
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
                            className="beheer-input w-full rounded-xl border border-border-color bg-bg-soft px-4 py-2.5 text-xs font-medium text-text-main focus:border-theme-purple focus:outline-none"
                        />
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || isPending}
                        className="beheer-button flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50 sm:w-auto"
                    >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        <span>Aan Wachtrij Toevoegen</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
