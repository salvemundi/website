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
        <div className="bg-bg-card rounded-2xl p-5 sm:p-6 border border-border-color shadow-xs">
            <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                </div>
                <span>Gasten Toevoegen</span>
            </h3>

            <form
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
                className="space-y-4"
            >
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
                            className={`beheer-button min-h-11 flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                activityType === 'shotjes'
                                    ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs'
                                    : 'bg-bg-soft border-border-color text-text-muted hover:border-amber-500/40'
                            }`}
                        >
                            <Flame className="h-3.5 w-3.5 text-amber-500" />
                            <span>Shotjes</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActivityType('watervallen')}
                            className={`beheer-button min-h-11 flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                activityType === 'watervallen'
                                    ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                                    : 'bg-bg-soft border-border-color text-text-muted hover:border-blue-500/40'
                            }`}
                        >
                            <Waves className="h-3.5 w-3.5 text-blue-500" />
                            <span>Watervallen</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActivityType('anders')}
                            className={`beheer-button min-h-11 flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                activityType === 'anders'
                                    ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
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
                        disabled={isSubmitting || isPending}
                        className="beheer-button w-full sm:w-auto min-h-11 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span>Aan Wachtrij Toevoegen</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
