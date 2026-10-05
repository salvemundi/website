'use client';

import { useRouter } from 'next/navigation';
import { 
    Users, 
    Mail
} from 'lucide-react';

import { type BeheerMember } from '@salvemundi/validations';

export type Member = BeheerMember;

interface LedenTableProps {
    members: Member[];
    formatDate: (date: string | null | undefined) => string;
    isMembershipActive: (member: Member) => boolean;
}

export default function LedenTable({
    members = [],
    formatDate,
    isMembershipActive
}: LedenTableProps) {
    const router = useRouter();

    return (
        <div className="overflow-hidden card-base p-0">
            {/* Mobile: stacked cards (avoids horizontal scrolling / clipped columns) */}
            <div className="divide-y divide-purple-500/10 md:hidden">
                {members.map((member) => (
                    <div
                        key={member.id}
                        onClick={() => router.push(`/beheer/leden/${member.id}`)}
                        className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-theme-purple/5 active:bg-theme-purple/10"
                    >
                        <div className="icon-box size-10 shrink-0 text-sm font-semibold">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-(--text-main)">
                                {member.first_name} {member.last_name}
                            </p>
                            <p className="truncate text-xs text-(--text-muted)">{member.email}</p>
                        </div>
                        <span suppressHydrationWarning className={`badge-status shrink-0 ${isMembershipActive(member)
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}>
                            Tot {formatDate(member.membership_expiry)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Desktop / tablet: full table */}
            <div className="hidden custom-scrollbar overflow-x-auto md:block">
                <table className="w-full min-w-200 border-collapse text-left">
                    <thead>
                        <tr className="border-b border-theme-purple/10 bg-theme-purple/5 text-xs font-semibold text-(--text-muted)">
                            <th className="p-4 md:px-8">Lid</th>
                            <th className="p-4 md:px-8">Contactgegevens</th>
                            <th className="p-4 md:px-8">Validiteit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-purple/10">
                        {members.map((member) => (
                            <tr
                                key={member.id}
                                onClick={() => router.push(`/beheer/leden/${member.id}`)}
                                className="group cursor-pointer transition-colors hover:bg-theme-purple/5"
                            >
                                <td className="p-4 md:px-8">
                                    <div className="flex items-center gap-4">
                                        <div className="icon-box size-10 shrink-0 text-sm font-semibold transition-transform group-hover:scale-105">
                                            {member.first_name?.[0]}{member.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-(--text-main)">
                                                {member.first_name} {member.last_name}
                                            </p>
                                            <p className="text-xs text-(--text-muted)">Lid ID: {member.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-medium text-(--text-muted) md:px-8">
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-4 opacity-50" />
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="transition-colors hover:text-theme-purple"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            {member.email}
                                        </a>
                                    </div>
                                </td>
                                <td className="p-4 md:px-8">
                                    <span suppressHydrationWarning className={`badge-status ${isMembershipActive(member)
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}>
                                        Tot {formatDate(member.membership_expiry)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {members.length === 0 && (
                <div className="p-16 text-center">
                    <Users className="mx-auto mb-4 size-12 text-(--text-muted) opacity-40" />
                    <h3 className="mb-2 text-lg font-bold text-(--text-main)">Geen leden gevonden</h3>
                    <p className="text-xs text-(--text-muted)">Pas de filters aan of probeer een andere zoekterm.</p>
                </div>
            )}
        </div>
    );
}
