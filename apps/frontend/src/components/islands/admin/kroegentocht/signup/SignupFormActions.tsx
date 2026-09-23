'use client';

import { RefreshCw, Trash, Loader2, Save } from 'lucide-react';

interface SignupFormActionsProps {
    isPending: boolean;
    onReset: () => void;
    onDelete: () => void;
}

export default function SignupFormActions({ isPending, onReset, onDelete }: SignupFormActionsProps) {
    return (
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex w-full gap-4 md:w-auto">
                <button
                    type="button"
                    onClick={onReset}
                    className="beheer-button flex flex-1 items-center justify-center gap-2 rounded-xl border border-(--border-color) bg-(--bg-card) px-8 py-4 text-xs font-semibold text-(--text-light) shadow-sm transition-all hover:text-(--theme-purple) active:scale-95 md:flex-none"
                >
                    <RefreshCw className="size-4" />
                    Reset
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="beheer-button flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-8 py-4 text-xs font-semibold text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white active:scale-95 md:flex-none"
                >
                    <Trash className="size-4" />
                    Verwijder Aanmelding
                </button>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="beheer-button flex w-full items-center justify-center gap-3 rounded-xl bg-(--theme-purple) px-12 py-5 text-sm font-semibold text-white shadow-(--shadow-glow) transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 md:w-auto"
            >
                {isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                ) : (
                    <Save className="size-5" />
                )}
                Wijzigingen Opslaan
            </button>
        </div>
    );
}
