'use client';

import React from 'react';
import { 
    Shield, 
    Award, 
    Hash 
} from 'lucide-react';
import { COMMITTEES } from '@/shared/lib/permissions-config';

export function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--beheer-card-soft)] flex items-center justify-center text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors border border-[var(--beheer-border)]">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-black text-[var(--beheer-text-muted)] tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-extrabold text-[var(--beheer-text)] truncate">{value}</p>
            </div>
        </div>
    );
}

export function CommitteeCard({ membership, cleanName }: { membership: any, cleanName: (n: string) => string }) {
    return (
        <div className="p-5 rounded-3xl bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] flex flex-col gap-3 group hover:border-[var(--beheer-accent)]/30 transition-all shadow-sm">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--beheer-accent)]/10 flex items-center justify-center text-[var(--beheer-accent)] group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="font-extrabold text-[var(--beheer-text)] truncate">{cleanName(membership.committee_id.name)}</p>
                    {membership.is_leader && membership.committee_id.azure_group_id !== COMMITTEES.BESTUUR && (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-[var(--beheer-accent)] uppercase tracking-widest mt-0.5">
                            <Award className="h-3 w-3" />
                            Commissie Leider
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function GroupCard({ membership, cleanName }: { membership: any, cleanName: (n: string) => string }) {
    return (
        <div className="p-4 rounded-2xl bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] flex items-center gap-4 group hover:border-[var(--beheer-accent)]/30 transition-all shadow-sm">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--beheer-card-soft)] flex items-center justify-center text-[var(--beheer-text-muted)] group-hover:bg-[var(--beheer-accent)] group-hover:text-white transition-all shadow-sm border border-[var(--beheer-border)]">
                <Hash className="h-5 w-5" />
            </div>
            <p className="font-extrabold text-[var(--beheer-text)] text-sm truncate">{cleanName(membership.committee_id.name)}</p>
        </div>
    );
}

export function SignupStatus({ status }: { status: string }) {
    switch (status) {
        case 'paid':
            return (
                <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Betaald
                </span>
            );
        case 'failed':
        case 'canceled':
            return (
                <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Mislukt
                </span>
            );
        default:
            return (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Open
                </span>
            );
    }
}

export function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
    return (
        <div className="py-16 text-center border-2 border-dashed border-[var(--beheer-border)] rounded-3xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--beheer-card-soft)] mb-3 text-[var(--beheer-text-muted)] opacity-30">
                <Icon className="h-6 w-6" />
            </div>
            <p className="text-[var(--beheer-text-muted)] font-medium italic text-sm">{message}</p>
        </div>
    );
}

export const cleanName = (name: string) => {
    return name
        .replace(/\s*(\|\||\||–|-)\s*Salve\s*Mundi/gi, '')
        .replace(/\s*SaMu\s*(\|\||\|)\s*/gi, '')
        .trim();
};
