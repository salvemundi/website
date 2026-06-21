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
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) shadow-sm ring-1 ring-(--beheer-border) overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-(--beheer-border) bg-(--beheer-card-soft) text-xs font-semibold text-(--beheer-text-muted)">
                            <th className="px-4 md:px-8 py-4">Lid</th>
                            <th className="px-4 md:px-8 py-4">Contactgegevens</th>
                            <th className="px-4 md:px-8 py-4">Validiteit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {members.map((member) => (
                            <tr 
                                key={member.id} 
                                onClick={() => router.push(`/beheer/leden/${member.id}`)}
                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer"
                            >
                                <td className="px-4 md:px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-(--beheer-accent)/10 flex items-center justify-center text-(--beheer-accent) font-semibold text-sm ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform group-hover:scale-110">
                                            {member.first_name?.[0]}{member.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                                                {member.first_name} {member.last_name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Lid ID: {member.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                        <a 
                                            href={`mailto:${member.email}`} 
                                            className="hover:text-(--beheer-accent) transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {member.email}
                                        </a>
                                    </div>
                                </td>
                                <td className="px-4 md:px-8 py-5">
                                    <span suppressHydrationWarning className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold ${isMembershipActive(member)
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
                    <Users className="h-16 w-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Geen leden gevonden</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Pas de filters aan of probeer een andere zoekterm.</p>
                </div>
            )}
        </div>
    );
}
