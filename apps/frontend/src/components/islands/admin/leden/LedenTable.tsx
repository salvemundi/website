'use client';

import { useRouter } from 'next/navigation';
import { 
    Users, 
    Mail
} from 'lucide-react';

import { type AdminMember } from '@salvemundi/validations';

export type Member = AdminMember;

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
        <div className="overflow-hidden rounded-(--beheer-radius) bg-(--beheer-card-bg) shadow-sm ring-1 ring-(--beheer-border)">
            {/* Mobile: stacked cards (avoids horizontal scrolling / clipped columns) */}
            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-700/50">
                {members.map((member) => (
                    <div
                        key={member.id}
                        onClick={() => router.push(`/beheer/leden/${member.id}`)}
                        className="flex cursor-pointer items-center gap-3 p-4 transition-colors active:bg-slate-50/50 dark:active:bg-slate-700/20"
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-(--beheer-accent)/10 text-sm font-semibold text-(--beheer-accent) shadow-sm ring-2 ring-white dark:ring-slate-800">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate leading-tight font-semibold text-slate-900 dark:text-white">
                                {member.first_name} {member.last_name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                        </div>
                        <span suppressHydrationWarning className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${isMembershipActive(member)
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                            Tot {formatDate(member.membership_expiry)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Desktop / tablet: full table */}
            <div className="custom-scrollbar hidden overflow-x-auto md:block">
                <table className="w-full min-w-200 border-collapse text-left">
                    <thead>
                        <tr className="border-b border-(--beheer-border) bg-(--beheer-card-soft) text-xs font-semibold text-(--beheer-text-muted)">
                            <th className="p-4 md:px-8">Lid</th>
                            <th className="p-4 md:px-8">Contactgegevens</th>
                            <th className="p-4 md:px-8">Validiteit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {members.map((member) => (
                            <tr
                                key={member.id}
                                onClick={() => router.push(`/beheer/leden/${member.id}`)}
                                className="group cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/20"
                            >
                                <td className="px-4 py-5 md:px-8">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-(--beheer-accent)/10 text-sm font-semibold text-(--beheer-accent) shadow-sm ring-2 ring-white transition-transform group-hover:scale-110 dark:ring-slate-800">
                                            {member.first_name?.[0]}{member.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="leading-tight font-semibold text-slate-900 dark:text-white">
                                                {member.first_name} {member.last_name}
                                            </p>
                                            <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">Lid ID: {member.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-5 text-sm font-medium text-slate-500 md:px-8 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-4 text-slate-300 dark:text-slate-600" />
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="transition-colors hover:text-(--beheer-accent)"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {member.email}
                                        </a>
                                    </div>
                                </td>
                                <td className="px-4 py-5 md:px-8">
                                    <span suppressHydrationWarning className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold ${isMembershipActive(member)
                                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
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
                <div className="p-20 text-center">
                    <Users className="mx-auto mb-4 size-16 text-slate-200 dark:text-slate-700" />
                    <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Geen leden gevonden</h3>
                    <p className="font-medium text-slate-500 dark:text-slate-400">Pas de filters aan of probeer een andere zoekterm.</p>
                </div>
            )}
        </div>
    );
}
