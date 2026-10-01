'use client';

import { User } from 'lucide-react';

export default function SignupHeader() {
    return (
        <div className="rounded-t-2xl border-b border-(--border-color)/30 bg-(--bg-main)/30 p-8">
            <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-(--text-main)">
                <User className="size-6 text-(--theme-purple)" />
                Aanmelding <span className="text-(--theme-purple)">Details</span>
            </h2>
            <p className="mt-1 text-[10px] font-semibold text-(--text-muted)">Beheer gegevens en tickets van de deelnemer</p>
        </div>
    );
}
