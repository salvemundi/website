'use client';

import { Edit, Mail, Trash2 } from 'lucide-react';
import GroupSelectDropdown from './GroupSelectDropdown';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface Participant {
    name: string;
    initial: string;
}

interface ExtendedSignup extends PubCrawlSignup {
    participants?: Participant[];
    created_at?: string | Date;
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
        <div className="bg-(--bg-card) rounded-2xl shadow-(--shadow-card) ring-1 ring-(--border-color)/30 overflow-hidden animate-in fade-in duration-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-(--bg-main)/50 border-b border-(--border-color)/30">
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted)">Deelnemers</th>
                            <th className="px-6 py-4 text-center text-[10px] font-semibold text-(--text-muted)">Tickets</th>
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted) hidden lg:table-cell">Vereniging</th>
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted)">Groep</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-color)/20">
                        {filteredSignups.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center text-(--text-muted) italic font-medium">
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
                                    <tr key={signup.id} className="hover:bg-(--bg-main)/30 transition-colors border-b border-(--border-color)/10 last:border-0">
                                        <td className="px-6 py-3 min-w-[300px]">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <a href={`mailto:${signup.email}`} className="text-sm font-semibold text-(--text-main) hover:text-(--theme-purple) transition-colors flex items-center gap-2" title={signup.email}>
                                                        <Mail className="h-3.5 w-3.5 text-(--text-muted)" />
                                                        {signup.name} <span className="text-xs text-(--text-muted) font-normal">({signup.email})</span>
                                                    </a>
                                                </div>

                                                {isLeaderOfGroup && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-[9px] font-semibold text-amber-700 dark:text-amber-400 w-fit">
                                                        👑 Groepsleider ({isLeaderOfGroup})
                                                    </span>
                                                )}

                                                {participants.length > 0 && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {participants.map((p, i) => {
                                                            const rawName = p.name || 'Onbekend';
                                                            const rawInitial = p.initial || '';

                                                            return (
                                                                <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-(--bg-main)/80 rounded-md ring-1 ring-(--border-color)/30 text-[10px] font-medium text-(--text-light)">
                                                                    <span className="text-(--text-muted) truncate max-w-[120px]">
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
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-(--theme-purple)/10 text-(--theme-purple) text-[10px] font-semibold ring-1 ring-(--theme-purple)/30">
                                                {signup.amount_tickets}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-[11px] font-medium text-(--text-muted) hidden lg:table-cell">
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

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => signup.id && onEdit(signup.id)}
                                                        className="p-1.5 rounded-md hover:bg-(--theme-purple)/10 text-(--text-muted) hover:text-(--theme-purple) transition-all cursor-pointer"
                                                        title="Inschrijving bewerken"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => signup.id && onDelete(signup.id)}
                                                        className="p-1.5 rounded-md hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-all cursor-pointer"
                                                        title="Inschrijving verwijderen"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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
