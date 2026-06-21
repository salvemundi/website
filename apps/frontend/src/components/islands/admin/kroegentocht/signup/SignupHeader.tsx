'use client';

import { User } from 'lucide-react';

export default function SignupHeader() {
    return (
        <div className="p-8 border-b border-(--border-color)/30 bg-(--bg-main)/30 rounded-t-2xl">
            <h2 className="text-2xl font-semibold text-(--text-main) tracking-tight flex items-center gap-3">
                <User className="h-6 w-6 text-(--theme-purple)" />
                Aanmelding <span className="text-(--theme-purple)">Details</span>
            </h2>
            <p className="text-[10px] font-semibold text-(--text-muted) mt-1">Beheer gegevens en tickets van de deelnemer</p>
        </div>
    );
}
