'use client';

import { type WhatsAppGroup } from '@salvemundi/validations/schema/profiel.zod';
import { MessageCircle, ExternalLink, ShieldAlert, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { stripHtml } from '@/shared/lib/text';

interface WhatsAppGroupsIslandProps {
    groups: WhatsAppGroup[];
    gedragscodeUrl: string;
}

export const WhatsAppGroupsIsland: React.FC<WhatsAppGroupsIslandProps> = ({ groups, gedragscodeUrl }) => {

    const handleJoinGroup = (inviteLink: string) => {
        window.open(inviteLink, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="mx-auto max-w-6xl">
            {/* Info Banner */}
            <div className="mb-8 rounded-2xl bg-bg-card p-6 shadow-md">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/5 text-purple-700 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                        <Info className="size-6" />
                    </div>
                    <div>
                        <h3 className="mb-2 font-semibold text-text-main">Over WhatsApp Groepen</h3>
                        <p className="text-sm text-text-muted">
                            Deze groepen zijn exclusief voor actieve leden. Klik op een groep om via WhatsApp lid te worden.
                            Wees respectvol en volg de groepsregels.
                        </p>
                    </div>
                </div>
            </div>

            {/* Groups Section */}
            {groups.length === 0 ? (
                <div className="rounded-3xl bg-bg-card py-12 text-center shadow-sm">
                    <MessageCircle className="mx-auto mb-4 size-16 text-slate-400" />
                    <div className="mb-4 font-semibold text-text-main">Momenteel geen WhatsApp groepen beschikbaar.</div>
                    <p className="mb-4 text-sm text-text-muted">
                        Kom later terug voor nieuwe groepen om lid van te worden!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {groups.map((group) => (
                        <div key={group.id} className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-bg-card p-6 shadow-lg transition-all hover:shadow-xl">
                            <div className="mb-4 flex items-start gap-4">
                                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-500 dark:bg-transparent dark:text-purple-300">
                                    <MessageCircle className="size-8" />
                                </div>
                                <div className="mt-1 flex-1">
                                    <h3 className="mb-2 text-xl font-bold text-text-main">
                                        {group.name}
                                    </h3>
                                    {group.description && (
                                        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-line text-text-muted sm:text-base">
                                            {stripHtml(group.description)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between border-t border-purple-100 pt-4 dark:border-white/10">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-500 dark:border dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                        <ShieldAlert className="size-3" />
                                        Alleen Leden
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleJoinGroup(group.invite_link)}
                                    className="form-button flex items-center gap-2 rounded-full bg-purple-500 px-6 py-2 font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
                                >
                                    <span>Word Lid</span>
                                    <ArrowRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 rounded-3xl bg-bg-card p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold text-text-main">Groepsregels</h3>
                <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-purple-500" />
                        <span>Wees respectvol naar alle leden</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-purple-500" />
                        <span>Houd gesprekken relevant voor het groepsonderwerp</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-purple-500" />
                        <span>Geen spam of promotionele inhoud</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-purple-500" />
                        <span>
                            Volg de{' '}
                            <Link
                                href={gedragscodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-purple-500 hover:underline"
                            >
                                gedragscode van Salve Mundi <ExternalLink className="size-3" />
                            </Link>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
