'use client';

import { User } from 'lucide-react';

export default function SignupHeader() {
    return (
        <div className="p-8 border-b border-[var(--border-color)]/30 bg-[var(--bg-main)]/30 rounded-t-[var(--radius-2xl)]">
            <h2 className="text-2xl font-semibold text-[var(--text-main)] tracking-tight flex items-center gap-3">
                <User className="h-6 w-6 text-[var(--theme-purple)]" />
                Aanmelding <span className="text-[var(--theme-purple)]">Details</span>
            </h2>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-1">Beheer gegevens en tickets van de deelnemer</p>
        </div>
    );
}
