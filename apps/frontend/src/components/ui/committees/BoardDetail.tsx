import React from 'react';
import Image from 'next/image';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Mail, User, Users, Calendar, Instagram, Facebook, Globe, History, LayoutGrid, UserPlus } from 'lucide-react';

interface BoardDetailProps {
    committee?: Committee;
}

export const BoardDetail: React.FC<BoardDetailProps> = ({
    committee = {} as Committee
}) => {
    const cleanedName = committee.name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Bestuur';

    const members = (committee.members?.filter((m: any) => m.is_visible) || []).sort((a: any, b: any) => {
        if (a.is_leader && !b.is_leader) return -1;
        if (!a.is_leader && b.is_leader) return 1;
        return 0;
    });

    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Immersive Hero Section */}
            <header className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 pt-8">
                {/* Left: Text Content */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1 w-full">
                    <h1 className="mb-6 text-5xl font-black tracking-tight text-[var(--text-main)] sm:text-6xl md:text-7xl break-words leading-[1.1]">
                        {cleanedName}
                    </h1>

                    <div className="mb-10 text-xl leading-relaxed text-[var(--text-muted)] max-w-2xl font-medium">
                        {committee.description || `Het ${cleanedName} van Salve Mundi zet zich dagelijks in om de vereniging naar een hoger niveau te tillen en memorabele momenten te creëren voor al onze leden.`}
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                        {/* Primary CTA */}
                        {committee.email && (
                            <a 
                                href={`mailto:${committee.email}`}
                                className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--color-purple-600)] px-8 py-4 text-lg font-black text-white shadow-xl shadow-purple-600/20 transition-all hover:scale-105 hover:bg-[var(--color-purple-500)] active:scale-95 group"
                            >
                                <Mail className="h-5 w-5 transition-transform group-hover:-rotate-12" />
                                Interesse? Mail ons!
                            </a>
                        )}
                        
                        {cleanedName.toLowerCase().includes('bestuur') ? (
                            <a 
                                href="/commissies/oud-besturen"
                                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--border-color)]/50 px-8 py-4 text-lg font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color)] transition-all"
                            >
                                <History className="h-5 w-5" />
                                Geschiedenis
                            </a>
                        ) : (
                            <a 
                                href="/contact"
                                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--border-color)]/50 px-8 py-4 text-lg font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color)] transition-all"
                            >
                                <LayoutGrid className="h-5 w-5" />
                                Andere vragen?
                            </a>
                        )}
                    </div>
                </div>

                {/* Right: Image Element without the box */}
                <div className="relative w-full max-w-xs md:max-w-md lg:w-[450px] aspect-square order-1 lg:order-2 flex-shrink-0 lg:ml-auto group">
                    <div className="absolute inset-0 bg-[var(--color-purple-500)]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl -z-10" />
                    <Image
                        src={committee.image ? (getImageUrl(committee.image) ?? '/img/newlogo.svg') : '/img/newlogo.svg'}
                        alt={cleanedName}
                        fill
                        className="object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-2xl"
                        unoptimized
                        priority
                    />
                </div>
            </header>

            {/* Leden Sectie - Open Layout */}
            <section className="pt-20 border-t border-[var(--border-color)]/10">
                <div className="flex flex-col items-center mb-16">
                    <h2 className="flex items-center gap-4 text-4xl font-black text-[var(--text-main)]">
                        <Users className="h-10 w-10 text-[var(--color-purple-500)]" />
                        Ons Bestuur
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
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] bg-[var(--bg-soft)] px-4 py-1.5 rounded-full border border-[var(--border-color)]/10 text-center">
                                {member.user_id?.title || 'Algemeen bestuurslid'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
