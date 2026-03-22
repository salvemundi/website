import React from 'react';
import type { Committee } from '@salvemundi/validations';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';
import { Mail, Users, UserCheck } from 'lucide-react';

interface CommitteeDetailProps {
    committee: Committee;
}

export const CommitteeDetail: React.FC<CommitteeDetailProps> = ({ committee }) => {
    const cleanedName = committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
    
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Description & Image */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-3xl shadow-xl">
                        <Image
                            src={committee.image ? getImageUrl(committee.image) : '/img/placeholder.svg'}
                            alt={cleanedName}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <h2 className="text-3xl font-bold text-[var(--color-purple-500)]">Over de {cleanedName}</h2>
                        <div className="text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                            {committee.description || committee.short_description || 'Geen uitgebreide beschrijving beschikbaar.'}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar (Contact & Members) */}
                <div className="space-y-8">
                    {/* Contact Card */}
                    {committee.email && (
                        <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 rounded-3xl shadow-lg border-l-4 border-[var(--color-purple-500)]">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-[var(--color-purple-500)]" />
                                Contact
                            </h3>
                            <a 
                                href={`mailto:${committee.email}`}
                                className="text-[var(--color-purple-500)] font-medium hover:underline break-all"
                            >
                                {committee.email}
                            </a>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 rounded-3xl shadow-lg">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Users className="h-5 w-5 text-[var(--color-purple-500)]" />
                            Leden
                        </h3>
                        <div className="space-y-4">
                            {committee.members?.filter(m => m.is_visible).map((member, idx) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[var(--bg-soft)] transition-transform group-hover:scale-105">
                                        <Image
                                            src={member.user_id?.avatar ? getImageUrl(member.user_id.avatar) : '/img/placeholder.svg'}
                                            alt={member.user_id?.first_name || 'Lid'}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-[var(--text-main)]">
                                            {member.user_id?.first_name} {member.user_id?.last_name}
                                        </div>
                                        {/* Role label logic */}
                                        {(() => {
                                            const isBestuur = cleanedName.toLowerCase().includes('bestuur');
                                            if (isBestuur) {
                                                const title = member.user_id?.title || 'Algemeen bestuurslid';
                                                return (
                                                    <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-purple-500)] uppercase tracking-tight">
                                                        <UserCheck className="h-3 w-3" />
                                                        {title}
                                                    </div>
                                                );
                                            }
                                            if (member.is_leader) {
                                                return (
                                                    <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-purple-500)] uppercase tracking-tight">
                                                        <UserCheck className="h-3 w-3" />
                                                        Commissie Leider
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
