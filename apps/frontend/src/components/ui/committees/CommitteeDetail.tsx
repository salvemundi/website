import React from 'react';
import Image from 'next/image';
import { type Committee } from '@salvemundi/validations';
import { getImageUrl } from '@/lib/image-utils';
import { Mail, Shield, User, Users, Calendar, Instagram, Facebook, Globe, History, LayoutGrid, UserPlus } from 'lucide-react';
import { Skeleton } from '../Skeleton';

interface CommitteeDetailProps {
    isLoading?: boolean;
    committee?: Committee;
}

/**
 * Gedetailleerde weergave van een commissie.
 * Ondersteunt nu een hybride loading-state voor perfecte CLS.
 */
export const CommitteeDetail: React.FC<CommitteeDetailProps> = ({ 
    isLoading = false, 
    committee = {} as Committee 
}) => {
    const cleanedName = committee.name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
    
    // Skeleton-state: render exact dezelfde sectie-structuur
    if (isLoading) {
        return (
            <div className="space-y-12 animate-pulse" aria-busy="true">
                {/* Hero section skeleton */}
                <section className="relative overflow-hidden rounded-[2.5rem] bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-2xl">
                    <div className="flex flex-col lg:flex-row">
                        <div className="relative h-64 w-full lg:h-auto lg:w-1/2">
                            <Skeleton className="h-full w-full bg-[var(--color-purple-500)]/10" rounded="none" />
                        </div>
                        <div className="flex w-full flex-col p-8 sm:p-12 lg:w-1/2">
                            <div className="space-y-4 mb-8">
                                <Skeleton className="h-4 w-32 bg-[var(--color-purple-500)]/20" rounded="full" />
                                <Skeleton className="h-12 w-3/4 bg-[var(--color-purple-500)]/10" rounded="lg" />
                            </div>
                            <div className="space-y-4 mb-8">
                                <Skeleton className="h-4 w-full bg-[var(--color-purple-500)]/5" rounded="full" />
                                <Skeleton className="h-4 w-full bg-[var(--color-purple-500)]/5" rounded="full" />
                                <Skeleton className="h-4 w-2/3 bg-[var(--color-purple-500)]/5" rounded="full" />
                            </div>
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border-color)]/20">
                                <Skeleton className="h-12 w-32 bg-[var(--color-purple-500)]/10" rounded="xl" />
                                <Skeleton className="h-12 w-32 bg-[var(--color-purple-500)]/5" rounded="xl" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content grid skeleton */}
                <div className="grid gap-12 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-12">
                        <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-lg">
                            <Skeleton className="h-8 w-48 mb-8 bg-[var(--color-purple-500)]/10" rounded="lg" />
                            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-[var(--bg-soft)]/50 border border-[var(--border-color)]/10">
                                        <Skeleton className="h-24 w-24 mb-4 bg-[var(--color-purple-500)]/10 border-4 border-white/5" rounded="full" />
                                        <Skeleton className="h-6 w-32 mb-2 bg-[var(--color-purple-500)]/10" rounded="md" />
                                        <Skeleton className="h-3 w-20 bg-[var(--color-purple-500)]/5" rounded="full" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-8">
                        <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] p-8 shadow-lg">
                            <Skeleton className="h-7 w-32 mb-8 bg-[var(--color-purple-500)]/10" rounded="lg" />
                            <div className="space-y-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-14 w-14 bg-[var(--color-purple-500)]/10" rounded="2xl" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-3 w-16 bg-[var(--color-purple-500)]/10" rounded="full" />
                                            <Skeleton className="h-5 w-32 bg-[var(--color-purple-500)]/5" rounded="full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-2xl">
                <div className="flex flex-col lg:flex-row">
                    <div className="relative h-64 w-full lg:h-auto lg:w-1/2">
                        <Image
                            src={getImageUrl(committee.image) ?? '/img/placeholder.svg'}
                            alt={cleanedName}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)]/50 to-transparent lg:block hidden" />
                    </div>
                    <div className="flex w-full flex-col p-8 sm:p-12 lg:w-1/2">
                        <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-purple-500)]">
                            <Shield className="h-4 w-4" />
                            Commissie
                        </div>
                        <h1 className="mb-6 text-4xl font-black tracking-tight text-[var(--text-main)] sm:text-5xl lg:text-6xl">
                            {cleanedName}
                        </h1>
                        <p className="mb-8 text-lg leading-relaxed text-[var(--text-muted)] lg:text-xl">
                            {committee.description || `De ${cleanedName} van Salve Mundi zet zich in voor de vereniging en haar leden.`}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border-color)]/20">
                            {committee.email && (
                                <a 
                                    href={`mailto:${committee.email}`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-purple-500)] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
                                >
                                    <Mail className="h-4 w-4" />
                                    Mail Ons
                                </a>
                            )}
                            <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-soft)] px-6 py-3.5 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--border-color)]/10 active:scale-95">
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
                            Onze Leden
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {committee.members?.filter(m => m.is_visible).map((member, idx) => (
                                <div key={idx} className="group flex flex-col items-center p-6 rounded-2xl bg-[var(--bg-soft)]/50 border border-[var(--border-color)]/10 transition hover:bg-white dark:hover:bg-white/5 hover:border-[var(--color-purple-500)]/30">
                                    <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full ring-4 ring-[var(--color-purple-500)]/10 group-hover:ring-[var(--color-purple-500)]/30 transition">
                                        <Image
                                            src={getImageUrl(member.user_id?.avatar) ?? '/img/placeholder.svg'}
                                            alt={member.user_id?.first_name || 'Lid'}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <h4 className="text-center font-bold text-[var(--text-main)]">{member.user_id?.first_name} {member.user_id?.last_name}</h4>
                                    <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{member.is_leader ? 'Commissieleider' : 'Commissielid'}</span>
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
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Opgericht</p>
                                    <p className="font-bold">Sinds {new Date().getFullYear() - 5}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-purple-500)]/10 text-[var(--color-purple-500)]">
                                    <History className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Historie</p>
                                    <p className="font-bold">Inzichtelijk voor leden</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Socials / External Links */}
                    <section className="bg-gradient-theme rounded-[2rem] p-8 text-white shadow-xl">
                        <h3 className="mb-6 text-xl font-black">Social Media</h3>
                        <div className="flex gap-4">
                            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30 text-white">
                                <Instagram className="h-6 w-6" />
                            </button>
                            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30 text-white">
                                <Facebook className="h-6 w-6" />
                            </button>
                            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30 text-white">
                                <Globe className="h-6 w-6" />
                            </button>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};
