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
                    className="beheer-button-secondary flex-1 md:flex-none"
                >
                    <RefreshCw className="size-4" />
                    Reset
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="beheer-button-secondary flex-1 text-red-500 md:flex-none"
                >
                    <Trash className="size-4" />
                    Verwijder Aanmelding
                </button>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="beheer-button w-full px-12 py-5 shadow-(--shadow-glow) md:w-auto"
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
