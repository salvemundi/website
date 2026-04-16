import React from 'react';
import Image from 'next/image';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Mail, Shield, User, Users, Calendar, Instagram, Facebook, Globe, History, LayoutGrid, UserPlus } from 'lucide-react';

interface CommitteeDetailProps {
    committee?: Committee;
}

export const CommitteeDetail: React.FC<CommitteeDetailProps> = ({
    committee = {} as Committee
}) => {
    const cleanedName = committee.name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Commissie';

    const members = (committee.members?.filter((m: any) => m.is_visible) || []);

    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Immersive Hero Section */}
            <header className="relative w-full -mt-4 lg:-mt-8">
                {/* Hero Image - High Impact */}
                <div className="relative aspect-[16/6] md:aspect-[21/7] w-full bg-[var(--bg-soft)] overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-[var(--border-color)]/20">
                    <Image
                        src={committee.image ? (getImageUrl(committee.image) ?? '/img/newlogo.svg') : '/img/newlogo.svg'}
                        alt={cleanedName}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-transparent opacity-40" />
                </div>

                {/* Content Overlay / Underlay */}
                <div className="relative mt-12 flex flex-col items-center text-center max-w-5xl mx-auto px-4">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-purple-500)]">
                        <Shield className="h-4 w-4" />
                        Officiële Commissie
                    </div>
                    
                    <h1 className="mb-8 text-5xl font-black tracking-tight text-[var(--text-main)] sm:text-6xl lg:text-8xl break-words leading-[1.1]">
                        {cleanedName}
                    </h1>

                    <div className="mb-12 text-xl leading-relaxed text-[var(--text-muted)] lg:text-2xl max-w-4xl font-medium">
                        {committee.description || `De ${cleanedName} van Salve Mundi zet zich dagelijks in om de vereniging naar een hoger niveau te tillen en memorabele momenten te creëren voor al onze leden.`}
                    </div>

                    {/* Primary CTA - Focus on Interest */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full pt-4">
                        {committee.email && (
                            <a 
                                href={`mailto:${committee.email}`}
                                className="inline-flex items-center gap-4 rounded-full bg-[var(--color-purple-600)] px-10 py-5 text-lg font-black text-white shadow-2xl shadow-purple-600/30 transition-all hover:scale-105 hover:bg-[var(--color-purple-500)] active:scale-95 group"
                            >
                                <Mail className="h-6 w-6 transition-transform group-hover:-rotate-12" />
                                Interesse? Mail ons!
                            </a>
                        )}
                        
                        <a 
                            href="/contact"
                            className="text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] transition-colors flex items-center gap-2"
                        >
                            <LayoutGrid className="h-5 w-5" />
                            Andere vragen?
                        </a>
                    </div>
                </div>
            </header>

            {/* Leden Sectie - Open Layout */}
            <section className="pt-20 border-t border-[var(--border-color)]/10">
                <div className="flex flex-col items-center mb-16">
                    <h2 className="flex items-center gap-4 text-4xl font-black text-[var(--text-main)]">
                        <Users className="h-10 w-10 text-[var(--color-purple-500)]" />
                        Ons Team
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-transparent via-[var(--color-purple-500)] to-transparent rounded-full mt-6" />
                </div>
                
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                    {members.map((member: any, idx: number) => (
                        <div key={idx} className="group flex flex-col items-center">
                            <div className="relative mb-8 h-32 w-32 overflow-hidden rounded-full ring-8 ring-[var(--bg-soft)] group-hover:ring-[var(--color-purple-500)]/20 transition-all duration-500 shadow-lg">
                                <Image
                                    src={member.user_id?.avatar ? (getImageUrl(member.user_id.avatar) ?? '/img/newlogo.svg') : '/img/newlogo.svg'}
                                    alt={member.user_id?.first_name || 'Lid'}
                                    fill
                                    className="object-cover transition-all duration-500 scale-105 group-hover:scale-110"
                                    unoptimized
                                />
                            </div>
                            <h4 className="text-center font-black text-[var(--text-main)] text-xl mb-2 group-hover:text-[var(--color-purple-500)] transition-colors">
                                {`${member.user_id?.first_name} ${member.user_id?.last_name}`}
                            </h4>
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] bg-[var(--bg-soft)] px-4 py-1.5 rounded-full border border-[var(--border-color)]/10">
                                {member.is_leader ? 'Commissieleider' : 'Commissielid'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};