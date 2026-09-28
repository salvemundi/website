'use client';

import { Edit, Mail, Trash } from 'lucide-react';
import GroupSelectDropdown from './GroupSelectDropdown';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface Participant {
    name: string;
    initial: string;
}

interface ExtendedSignup extends PubCrawlSignup {
    participants?: Participant[];
    created_at: string;
}

interface GroupLeader {
    name: string;
    signupId?: number | null;
}

interface GroupConfig {
    name: string;
    leaders?: GroupLeader[];
}

interface SignupTableViewProps {
    filteredSignups: ExtendedSignup[];
    groupNames: string[];
    groupConfigs: GroupConfig[];
    onUpdateGroup?: (signupId: number, newGroupName: string | null) => Promise<void>;
    onEdit: (id: number | string) => void;
    onDelete: (id: number | string) => void;
    getParticipants: (signup: ExtendedSignup) => Participant[];
}

export default function SignupTableView({
    filteredSignups,
    groupNames,
    groupConfigs,
    onEdit,
    onDelete,
    onUpdateGroup,
    getParticipants
}: SignupTableViewProps) {
    return (
        <div className="animate-in fade-in overflow-hidden rounded-2xl bg-(--bg-card) shadow-(--shadow-card) ring-1 ring-(--border-color)/30 duration-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-(--border-color)/30 bg-(--bg-main)/50">
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted)">Deelnemers</th>
                            <th className="px-6 py-4 text-center text-[10px] font-semibold text-(--text-muted)">Tickets</th>
                            <th className="hidden px-6 py-4 text-[10px] font-semibold text-(--text-muted) lg:table-cell">Vereniging</th>
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted)">Groep</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-color)/20">
                        {filteredSignups.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center font-medium text-(--text-muted) italic">
                                    Geen aanmeldingen gevonden.
                                </td>
                            </tr>
                        ) : (
                            filteredSignups.map((signup) => {
                                const participants = getParticipants(signup);
                                const isLeaderOfGroup = groupConfigs.find(g => 
                                    (g.leaders || []).some(l => l.signupId === Number(signup.id))
                                )?.name;

                                return (
                                    <tr key={signup.id} className="border-b border-(--border-color)/10 transition-colors last:border-0 hover:bg-(--bg-main)/30">
                                        <td className="min-w-75 px-6 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <a href={`mailto:${signup.email}`} className="flex items-center gap-2 text-sm font-semibold text-(--text-main) transition-colors hover:text-(--theme-purple)" title={signup.email}>
                                                        <Mail className="size-3.5 text-(--text-muted)" />
                                                        {signup.name} <span className="text-xs font-normal text-(--text-muted)">({signup.email})</span>
                                                    </a>
                                                </div>

                                                {isLeaderOfGroup && (
                                                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
                                                        👑 Groepsleider ({isLeaderOfGroup})
                                                    </span>
                                                )}

                                                {participants.length > 0 && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {participants.map((p, i) => {
                                                            const rawName = p.name || 'Onbekend';
                                                            const rawInitial = p.initial || '';

                                                            return (
                                                                <div key={i} className="inline-flex items-center gap-1.5 rounded-md bg-(--bg-main)/80 px-2 py-0.5 text-[10px] font-medium text-(--text-light) ring-1 ring-(--border-color)/30">
                                                                    <span className="max-w-30 truncate text-(--text-muted)">
                                                                        {rawName}{rawInitial ? ` ${rawInitial}` : ''}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="inline-flex items-center justify-center rounded-full bg-(--theme-purple)/10 px-2.5 py-0.5 text-[10px] font-semibold text-(--theme-purple) ring-1 ring-(--theme-purple)/30">
                                                {signup.amount_tickets}
                                            </span>
                                        </td>
                                        <td className="hidden px-6 py-3 text-[11px] font-medium text-(--text-muted) lg:table-cell">
                                            {signup.association || '-'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                {onUpdateGroup && groupNames.length > 0 ? (
                                                    <GroupSelectDropdown
                                                        value={signup.group_name || ''}
                                                        options={groupNames}
                                                        onChange={(val) => { void onUpdateGroup(Number(signup.id), val); }}
                                                        size="xs"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-semibold text-(--text-muted)">
                                                        {signup.group_name || 'Niet ingedeeld'}
                                                    </span>
                                                )}

                                                <div className="flex shrink-0 items-center gap-1">
                                                    <button
                                                        onClick={() => signup.id && onEdit(signup.id)}
                                                        className="icon-button cursor-pointer rounded-md p-1.5 text-(--text-muted) transition-all hover:bg-(--theme-purple)/10 hover:text-(--theme-purple)"
                                                        title="Inschrijving bewerken"
                                                    >
                                                        <Edit className="size-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => signup.id && onDelete(signup.id)}
                                                        className="icon-button cursor-pointer rounded-md p-1.5 text-(--text-muted) transition-all hover:bg-red-500/10 hover:text-red-500"
                                                        title="Inschrijving verwijderen"
                                                    >
                                                        <Trash className="size-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
