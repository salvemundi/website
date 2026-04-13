import React from 'react';
import Image from 'next/image';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Mail, Shield, User, Users, Calendar, Instagram, Facebook, Globe, History, LayoutGrid, UserPlus } from 'lucide-react';
import { Skeleton } from '../Skeleton';

interface CommitteeDetailProps {
    isLoading?: boolean;
    committee?: Committee;
}

/**
 * Gedetailleerde weergave van een commissie.
 * Ondersteunt nu de Zero-Drift .skeleton-active mask standaard.
 */
export const CommitteeDetail: React.FC<CommitteeDetailProps> = ({ 
    isLoading = false, 
    committee = {} as Committee 
}) => {
    const cleanedName = committee.name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Loading Committee...';
    
    const members = isLoading 
        ? Array(6).fill({ user_id: { first_name: 'Loading', last_name: 'Member' }, is_leader: false, is_visible: true }) 
        : (committee.members?.filter(m => m.is_visible) || []);

    return (
        <div className={`space-y-12 animate-in fade-in duration-500 ${isLoading ? 'skeleton-active' : ''}`} aria-busy={isLoading}>
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-2xl">
                <div className="flex flex-col lg:flex-row">
                    <div className="relative h-64 w-full lg:h-auto lg:w-1/2 bg-[var(--bg-soft)]">
                        {!isLoading && committee.image && (
                            <Image
                                src={getImageUrl(committee.image) ?? '/img/placeholder.svg'}
                                alt={cleanedName}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)]/50 to-transparent lg:block hidden" />
                    </div>
                    <div className="flex w-full flex-col p-8 sm:p-12 lg:w-1/2">
                        <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-purple-500)]">
                            <Shield className="h-4 w-4" />
                            {isLoading ? 'LADEN...' : 'Commissie'}
                        </div>
                        <h1 className="mb-6 text-4xl font-black tracking-tight text-[var(--text-main)] sm:text-5xl lg:text-6xl">
                            {isLoading ? 'Loading Committee Title...' : cleanedName}
                        </h1>
                        <div className="mb-8 text-lg leading-relaxed text-[var(--text-muted)] lg:text-xl">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <p>Loading the description of this Salve Mundi committee. This includes all tasks, roles, and historical significance...</p>
                                    <p>Please wait while we fetch the latest data from the database server.</p>
                                </div>
                            ) : (
                                committee.description || `De ${cleanedName} van Salve Mundi zet zich in voor de vereniging en haar leden.`
                            )}
                        </div>
                        <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border-color)]/20">
                            {(!isLoading && committee.email) ? (
                                <a 
                                    href={`mailto:${committee.email}`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-purple-500)] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
                                >
                                    <Mail className="h-4 w-4" />
                                    Mail Ons
                                </a>
                            ) : (
                                <div className="h-12 w-32 bg-[var(--bg-soft)] rounded-xl" />
                            )}
                            <button disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-soft)] px-6 py-3.5 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--border-color)]/10 active:scale-95 disabled:opacity-50">
                                <UserPlus className="h-4 w-4" />
                                Lid Worden
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Grid */}
            <div className="grid gap-12 lg:grid-cols-3">
                {/* Leden Lijst */}
                <div className="lg:col-span-2 space-y-12">
                    <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-lg">
                        <h2 className="mb-8 flex items-center gap-3 text-2xl font-black text-[var(--text-main)]">
                            <Users className="h-6 w-6 text-[var(--color-purple-500)]" />
                            {isLoading ? 'Leden Laden...' : 'Onze Leden'}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {members.map((member, idx) => (
                                <div key={idx} className="group flex flex-col items-center p-6 rounded-2xl bg-[var(--bg-soft)]/50 border border-[var(--border-color)]/10 transition hover:bg-white dark:hover:bg-white/5 hover:border-[var(--color-purple-500)]/30">
                                    <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full ring-4 ring-[var(--color-purple-500)]/10 group-hover:ring-[var(--color-purple-500)]/30 transition bg-[var(--bg-soft)]">
                                        {!isLoading && member.user_id?.avatar && (
                                            <Image
                                                src={getImageUrl(member.user_id?.avatar) ?? '/img/placeholder.svg'}
                                                alt={member.user_id?.first_name || 'Lid'}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                    <h4 className="text-center font-bold text-[var(--text-main)]">
                                        {isLoading ? 'Loading Name' : `${member.user_id?.first_name} ${member.user_id?.last_name}`}
                                    </h4>
                                    <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                        {isLoading ? 'Loading Role' : (member.is_leader ? 'Commissieleider' : 'Commissielid')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Details */}
                <aside className="space-y-8">
                    <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] p-8 shadow-lg">
                        <h3 className="mb-6 text-xl font-black text-[var(--text-main)]">Details</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-purple-500)]/10 text-[var(--color-purple-500)]">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Opgericht</p>
                                    <p className="font-bold">{isLoading ? 'Loading Year' : `Sinds ${new Date().getFullYear() - 5}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-purple-500)]/10 text-[var(--color-purple-500)]">
                                    <History className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Historie</p>
                                    <p className="font-bold">{isLoading ? 'Loading Note' : 'Inzichtelijk voor leden'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Socials / External Links */}
                    <section className="bg-gradient-theme rounded-[2rem] p-8 text-white shadow-xl">
                        <h3 className="mb-6 text-xl font-black">Social Media</h3>
                        <div className="flex gap-4">
                            <button disabled={isLoading} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30 text-white disabled:opacity-50">
                                <Instagram className="h-6 w-6" />
                            </button>
                            <button disabled={isLoading} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30 text-white disabled:opacity-50">
                                <Facebook className="h-6 w-6" />
                            </button>
                            <button disabled={isLoading} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30 text-white disabled:opacity-50">
                                <Globe className="h-6 w-6" />
                            </button>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};
