'use client';

import { 
    Shield, 
    Award, 
    Hash 
} from 'lucide-react';
import { COMMITTEES } from '@/shared/lib/permissions-config';

import { LucideIcon } from 'lucide-react';

interface CommitteeMembership {
    committee_id: {
        name: string;
        azure_group_id?: string | null;
    };
    is_leader?: boolean;
}

export function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="h-10 w-10 shrink-0 squircle bg-(--beheer-card-soft) flex items-center justify-center text-(--beheer-text-muted) group-hover:text-(--beheer-accent) transition-colors border border-(--beheer-border)">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-(--beheer-text-muted) mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-(--beheer-text) truncate">{value}</p>
            </div>
        </div>
    );
}

export function CommitteeCard({ membership, cleanName }: { membership: CommitteeMembership, cleanName: (n: string) => string }) {
    return (
        <div className="p-5 squircle-lg bg-(--beheer-card-bg) border border-(--beheer-border) flex flex-col gap-3 group hover:border-(--beheer-accent)/30 transition-all shadow-sm">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-(--beheer-accent)/10 flex items-center justify-center text-(--beheer-accent) group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-(--beheer-text) truncate">{cleanName(membership.committee_id.name)}</p>
                    {membership.is_leader && membership.committee_id.azure_group_id !== COMMITTEES.BESTUUR && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-(--beheer-accent) mt-0.5">
                            <Award className="h-3 w-3" />
                            Commissie Leider
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function GroupCard({ membership, cleanName }: { membership: CommitteeMembership, cleanName: (n: string) => string }) {
    return (
        <div className="p-4 squircle bg-(--beheer-card-bg) border border-(--beheer-border) flex items-center gap-4 group hover:border-(--beheer-accent)/30 transition-all shadow-sm">
            <div className="h-10 w-10 shrink-0 squircle bg-(--beheer-card-soft) flex items-center justify-center text-(--beheer-text-muted) group-hover:bg-(--beheer-accent) group-hover:text-white transition-all shadow-sm border border-(--beheer-border)">
                <Hash className="h-5 w-5" />
            </div>
            <p className="font-semibold text-(--beheer-text) text-sm truncate">{cleanName(membership.committee_id.name)}</p>
        </div>
    );
}

export function SignupStatus({ status }: { status: string }) {
    switch (status) {
        case 'paid':
            return (
                <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-semibold">
                    Betaald
                </span>
            );
        case 'failed':
        case 'canceled':
            return (
                <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-semibold">
                    Mislukt
                </span>
            );
        default:
            return (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-semibold">
                    Open
                </span>
            );
    }
}

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon, message: string }) {
    return (
        <div className="py-16 text-center border-2 border-dashed border-(--beheer-border) squircle-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-(--beheer-card-soft) mb-3 text-(--beheer-text-muted) opacity-30">
                <Icon className="h-6 w-6" />
            </div>
            <p className="text-(--beheer-text-muted) font-medium italic text-sm">{message}</p>
        </div>
    );
}

export const cleanName = (name: string) => {
    return name
        .replace(/\s*(\|\||\||–|-)\s*Salve\s*Mundi/gi, '')
        .replace(/\s*SaMu\s*(\|\||\|)\s*/gi, '')
        .trim();
};
