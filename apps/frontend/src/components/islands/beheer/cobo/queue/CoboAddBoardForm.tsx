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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
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
        <div className="card-base">
            <h3 className="mb-4 section-title-sm">
                <div className="icon-box-sm">
                    <Plus className="size-4" />
                </div>
                <span>Recipiënt Toevoegen</span>
            </h3>

            <form
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
                className="space-y-4"
            >
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        value={boardName}
                        onChange={(event) => setBoardName(event.target.value)}
                        placeholder="Naam recipiënt"
                        required
                        className="beheer-input"
                    />

                    <div className="tab-bar-responsive">
                        <button
                            type="button"
                            onClick={() => setActivityType('shotjes')}
                            className={`tab-button ${activityType === 'shotjes' ? 'tab-button-active' : 'tab-button-inactive'}`}
                        >
                            <Flame className="size-3.5 shrink-0" />
                            <span className="truncate">Shotjes</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActivityType('watervallen')}
                            className={`tab-button ${activityType === 'watervallen' ? 'tab-button-active' : 'tab-button-inactive'}`}
                        >
                            <Waves className="size-3.5 shrink-0" />
                            <span className="truncate">Watervallen</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActivityType('anders')}
                            className={`tab-button ${activityType === 'anders' ? 'tab-button-active' : 'tab-button-inactive'}`}
                        >
                            <Edit3 className="size-3.5 shrink-0" />
                            <span className="truncate">Anders</span>
                        </button>
                    </div>
                </div>

                {activityType === 'anders' && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                        <input
                            type="text"
                            value={activityCustom}
                            onChange={(event) => setActivityCustom(event.target.value)}
                            placeholder="Radjedraaien, Blikjeblaffen, etc."
                            className="beheer-input"
                        />
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || isPending}
                        className="form-button min-h-11 w-full sm:w-auto"
                    >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        <span>Aan Wachtrij Toevoegen</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
