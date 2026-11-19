'use client';

import { Edit, FileDown, Mail, Trash } from 'lucide-react';
import ResendTicketEmailButton from './ResendTicketEmailButton';
import GroupSelectDropdown from './GroupSelectDropdown';
import { getParticipantNames } from '@/lib/utils/kroegentocht-signups';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface ExtendedSignup extends PubCrawlSignup {
    participants?: { name: string; initial: string }[];
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
    ticketsBySignup: Record<number, { id: number; name: string; initial: string; checkedIn: boolean }[]>;
}

export default function SignupTableView({
    filteredSignups,
    groupNames,
    groupConfigs,
    onEdit,
    onDelete,
    onUpdateGroup,
    ticketsBySignup
}: SignupTableViewProps) {
    return (
        <div className="animate-in fade-in overflow-hidden rounded-2xl bg-(--bg-card) shadow-(--shadow-card) ring-1 ring-(--border-color)/30 duration-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-(--border-color)/30 bg-(--bg-main)/50">
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted)">Inschrijving</th>
                            <th className="px-6 py-4 text-center text-[10px] font-semibold text-(--text-muted)">Personen</th>
                            <th className="hidden px-6 py-4 text-[10px] font-semibold text-(--text-muted) lg:table-cell">Vereniging</th>
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted)">Tickets</th>
                            <th className="px-6 py-4 text-[10px] font-semibold text-(--text-muted)">Groep</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-color)/20">
                        {filteredSignups.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center font-medium text-(--text-muted) italic">
                                    Geen aanmeldingen gevonden.
                                </td>
                            </tr>
                        ) : (
                            filteredSignups.map((signup) => {
                                const [primaryName, ...otherNames] = getParticipantNames(signup);
                                const leaderNames = new Set(groupConfigs.flatMap(g => (g.leaders || []).filter(l => l.signupId === Number(signup.id)).map(l => l.name.trim().toLowerCase())));
                                const crown = (n: string) => leaderNames.has(n.trim().toLowerCase()) ? '👑 ' : '';

                                return (
                                    <tr key={signup.id} className="border-b border-(--border-color)/10 transition-colors last:border-0 hover:bg-(--bg-main)/30">
                                        <td className="min-w-75 px-6 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <a href={`mailto:${signup.email ?? ''}`} className="flex items-center gap-2 text-sm font-semibold text-(--text-main) transition-colors hover:text-(--theme-purple)" title={signup.email ?? ''}>
                                                        <Mail className="size-3.5 text-(--text-muted)" />
                                                        {crown(primaryName)}{primaryName} <span className="text-xs font-normal text-(--text-muted)">({signup.email})</span>
                                                    </a>
                                                </div>


                                                {otherNames.length > 0 && (
                                                    <ul className="mt-1 space-y-0.5 pl-5.5">
                                                        {otherNames.map((name, i) => (
                                                            <li key={i} className="text-xs text-(--text-muted)">
                                                                + {crown(name)}{name}
                                                            </li>
                                                        ))}
                                                    </ul>
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
                                            {(() => {
                                                const tickets = ticketsBySignup[Number(signup.id)] ?? [];
                                                const checkedIn = tickets.filter((t) => t.checkedIn).length;
                                                const mismatch = tickets.length !== signup.amount_tickets;
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-[11px] font-semibold ${mismatch ? 'text-red-500' : 'text-(--text-muted)'}`}
                                                            title={tickets.map((t) => `${t.name} ${t.initial}.${t.checkedIn ? ' – ingecheckt' : ''}`).join('\n') || 'Geen tickets'}
                                                        >
                                                            {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
                                                            {checkedIn > 0 && ` · ${checkedIn} ingecheckt`}
                                                            {mismatch && ' ⚠'}
                                                        </span>
                                                        {tickets.length > 0 && (
                                                            <a
                                                                href={`/api/kroegentocht/tickets/${signup.id}`}
                                                                download
                                                                className="icon-button rounded-md p-1.5 text-(--text-muted) transition-all hover:bg-(--theme-purple)/10 hover:text-(--theme-purple)"
                                                                title="Tickets downloaden (PDF met QR-codes)"
                                                            >
                                                                <FileDown className="size-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })()}
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
                                                    <ResendTicketEmailButton signupId={Number(signup.id)} email={signup.email} paid={signup.payment_status === 'paid'} />
                                                    <button
                                                        onClick={() => signup.id && onEdit(signup.id)}
                                                        className="icon-button cursor-pointer rounded-md p-1.5 text-(--text-muted) transition-all hover:bg-(--theme-purple)/10 hover:text-(--theme-purple)"
                                                        title="Inschrijving bewerken"
                                                        type="button">
                                                        <Edit className="size-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => signup.id && onDelete(signup.id)}
                                                        className="icon-button cursor-pointer rounded-md p-1.5 text-(--text-muted) transition-all hover:bg-red-500/10 hover:text-red-500"
                                                        title="Inschrijving verwijderen"
                                                        type="button">
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
