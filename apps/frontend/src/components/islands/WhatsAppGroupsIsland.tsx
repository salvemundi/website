'use client';

import { WhatsAppGroup } from '@salvemundi/validations';
import { MessageCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface WhatsAppGroupsIslandProps {
    groups: WhatsAppGroup[];
    gedragscodeUrl: string;
}

export const WhatsAppGroupsIsland: React.FC<WhatsAppGroupsIslandProps> = ({ groups, gedragscodeUrl }) => {
    
    // Strip HTML as per legacy, safely in client
    const stripHtml = (html?: string | null) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };

    const handleJoinGroup = (inviteLink: string) => {
        window.open(inviteLink, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Info Banner */}
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 mb-8 shadow-md">
                <div className="flex items-start gap-4">
                    <span className="text-3xl" aria-hidden="true">ℹ️</span>
                    <div>
                        <h3 className="font-semibold text-[var(--text-main)] mb-2">Over WhatsApp Groepen</h3>
                        <p className="text-[var(--text-muted)] text-sm">
                            Deze groepen zijn exclusief voor actieve leden. Klik op een groep om via WhatsApp lid te worden.
                            Wees respectvol en volg de groepsregels.
                        </p>
                    </div>
                </div>
            </div>

            {/* Groups Section */}
            {groups.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-card)] rounded-3xl shadow-sm">
                    <div className="text-6xl mb-4" aria-hidden="true">💬</div>
                    <div className="text-[var(--text-main)] mb-4 font-semibold">Momenteel geen WhatsApp groepen beschikbaar.</div>
                    <p className="text-[var(--text-muted)] text-sm mb-4">
                        Kom later terug voor nieuwe groepen om lid van te worden!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] p-6 shadow-lg hover:shadow-xl transition-all h-full flex flex-col justify-between">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-[var(--color-purple-100)] flex items-center justify-center flex-shrink-0 text-[var(--color-purple-500)]">
                                    <MessageCircle className="h-8 w-8" />
                                </div>
                                <div className="flex-1 mt-1">
                                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">
                                        {group.name}
                                    </h3>
                                    {group.description && (
                                        <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed whitespace-pre-line break-words">
                                            {stripHtml(group.description)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-purple-100)]">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="px-3 py-1 bg-[var(--color-purple-100)] rounded-full text-xs font-semibold text-[var(--color-purple-500)] flex items-center gap-1">
                                        <ShieldAlert className="h-3 w-3" />
                                        Alleen Leden
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleJoinGroup(group.invite_link)}
                                    className="px-6 py-2 bg-[var(--color-purple-500)] text-[var(--color-white)] rounded-full font-semibold shadow-md transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <span>Word Lid</span>
                                    <span className="ml-1" aria-hidden="true">→</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 rounded-3xl bg-[var(--bg-card)] p-6 shadow-lg">
                <h3 className="font-semibold text-[var(--text-main)] mb-4 text-lg">Groepsregels</h3>
                <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                    <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-purple-500)]" />
                        <span>Wees respectvol naar alle leden</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-purple-500)]" />
                        <span>Houd gesprekken relevant voor het groepsonderwerp</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-purple-500)]" />
                        <span>Geen spam of promotionele inhoud</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-purple-500)]" />
                        <span>
                            Volg de{' '}
                            <Link
                                href={gedragscodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-purple-500)] font-semibold inline-flex items-center gap-1 hover:underline"
                            >
                                gedragscode van Salve Mundi <ExternalLink className="h-3 w-3" />
                            </Link>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
