'use client';

import { RefreshCw, Trash2, Loader2, Save } from 'lucide-react';

interface SignupFormActionsProps {
    isPending: boolean;
    onReset: () => void;
    onDelete: () => void;
}

export default function SignupFormActions({ isPending, onReset, onDelete }: SignupFormActionsProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 w-full md:w-auto">
                <button
                    type="button"
                    onClick={onReset}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-(--bg-card) border border-(--border-color) rounded-xl text-xs font-semibold text-(--text-light) hover:text-(--theme-purple) transition-all active:scale-95 shadow-sm"
                >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                    <Trash2 className="h-4 w-4" />
                    Verwijder Aanmelding
                </button>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-(--theme-purple) text-white font-semibold text-sm rounded-xl shadow-(--shadow-glow) hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
            >
                {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Save className="h-5 w-5" />
                )}
                Wijzigingen Opslaan
            </button>
        </div>
    );
}
