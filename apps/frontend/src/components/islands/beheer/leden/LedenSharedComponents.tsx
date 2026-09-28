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
        <div className="group flex items-center gap-4">
            <div className="squircle flex size-10 shrink-0 items-center justify-center border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-accent)">
                <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-xs font-semibold text-(--beheer-text-muted)">{label}</p>
                <p className="truncate text-sm font-semibold text-(--beheer-text)">{value}</p>
            </div>
        </div>
    );
}

export function CommitteeCard({ membership, cleanName }: { membership: CommitteeMembership, cleanName: (n: string) => string }) {
    return (
        <div className="squircle-lg group flex flex-col gap-3 border border-(--beheer-border) bg-(--beheer-card-bg) p-5 shadow-sm transition-all hover:border-(--beheer-accent)/30">
            <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--beheer-accent)/10 text-(--beheer-accent) transition-transform group-hover:scale-110">
                    <Shield className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="truncate font-semibold text-(--beheer-text)">{cleanName(membership.committee_id.name)}</p>
                    {membership.is_leader && membership.committee_id.azure_group_id !== COMMITTEES.BESTUUR && (
                        <span className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-(--beheer-accent)">
                            <Award className="size-3" />
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
        <div className="squircle group flex items-center gap-4 border border-(--beheer-border) bg-(--beheer-card-bg) p-4 shadow-sm transition-all hover:border-(--beheer-accent)/30">
            <div className="squircle flex size-10 shrink-0 items-center justify-center border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text-muted) shadow-sm transition-all group-hover:bg-(--beheer-accent) group-hover:text-white">
                <Hash className="size-5" />
            </div>
            <p className="truncate text-sm font-semibold text-(--beheer-text)">{cleanName(membership.committee_id.name)}</p>
        </div>
    );
}

export function SignupStatus({ status }: { status: string }) {
    switch (status) {
        case 'paid':
            return (
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-semibold text-green-500">
                    Betaald
                </span>
            );
        case 'failed':
        case 'canceled':
            return (
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-semibold text-red-500">
                    Mislukt
                </span>
            );
        default:
            return (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-500">
                    Open
                </span>
            );
    }
}

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon, message: string }) {
    return (
        <div className="squircle-lg border-2 border-dashed border-(--beheer-border) py-16 text-center">
            <div className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-(--beheer-card-soft) text-(--beheer-text-muted) opacity-30">
                <Icon className="size-6" />
            </div>
            <p className="text-sm font-medium text-(--beheer-text-muted) italic">{message}</p>
        </div>
    );
}

export const cleanName = (name: string) => {
    return name
        .replace(/\s*(\|\||\||–|-)\s*Salve\s*Mundi/gi, '')
        .replace(/\s*SaMu\s*(\|\||\|)\s*/gi, '')
        .trim();
};
