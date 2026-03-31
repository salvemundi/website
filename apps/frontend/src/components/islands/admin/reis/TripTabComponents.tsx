'use client';

import React from 'react';

export const inputClass = 'w-full px-5 py-4 rounded-xl bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] text-[var(--beheer-text)] text-sm font-bold focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">{label}</label>
            {children}
        </div>
    );
}
