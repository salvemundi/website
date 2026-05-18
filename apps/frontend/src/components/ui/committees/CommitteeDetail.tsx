import Image from 'next/image';
import Link from 'next/link';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Mail, Users, History, LayoutGrid } from 'lucide-react';

interface CommitteeDetailProps {
    committee: Committee;
}

export const CommitteeDetail = ({ committee }: CommitteeDetailProps) => {
    const cleanedName = committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Commissie';
    const isBestuur = cleanedName.toLowerCase().includes('bestuur');

    const members = (committee.members?.filter(m => m.is_visible) || []).sort((a, b) => {
        if (a.is_leader && !b.is_leader) return -1;
        if (!a.is_leader && b.is_leader) return 1;
        return 0;
    });

    return (
        <div className="@container space-y-12">
            <header className="flex flex-col w-full @[900px]:flex-row items-center @[900px]:items-start gap-8 @[900px]:gap-20 pt-4">
                <div className="flex-1 flex flex-col items-center @[900px]:items-start text-center @[900px]:text-left order-2 @[900px]:order-1 w-full @[900px]:pt-8">
                    <h1 className="mb-4 text-5xl font-black tracking-tight text-[var(--text-main)] @[600px]:text-6xl @[900px]:text-7xl break-words leading-[1.1]">
                        {cleanedName}
                    </h1>

                    <div className="mb-6 text-xl leading-relaxed text-[var(--text-muted)] max-w-2xl font-medium">
                        {committee.description || `De ${cleanedName} van Salve Mundi zet zich dagelijks in om de vereniging naar een hoger niveau te tillen en memorabele momenten te creëren voor al onze leden.`}
                    </div>

                    <div className="flex flex-wrap items-center justify-center @[900px]:justify-start gap-4">
                        {committee.email && (
                            <a
                                href={`mailto:${committee.email}`}
                                className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--color-purple-600)] px-8 py-3 text-lg font-black text-white shadow-xl shadow-purple-600/20 transition-all hover:scale-105 hover:bg-[var(--color-purple-500)] active:scale-95 group"
                            >
                                <Mail className="h-5 w-5 transition-transform group-hover:-rotate-12" />
                                Interesse? Mail ons!
                            </a>
                        )}

                        {isBestuur ? (
                            <Link
                                href="/commissies/oud-besturen"
                                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--border-color)]/50 px-8 py-3 text-lg font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color)] transition-all"
                            >
                                <History className="h-5 w-5" />
                                Geschiedenis
                            </Link>
                        ) : (
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--border-color)]/50 px-8 py-3 text-lg font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color)] transition-all"
                            >
                                <LayoutGrid className="h-5 w-5" />
                                Andere vragen?
                            </Link>
                        )}
                    </div>
                </div>

                <div className="relative w-full max-w-[450px] @[900px]:w-[450px] aspect-square order-1 @[900px]:order-2 flex-shrink-0 mx-auto @[900px]:ml-auto group">
                    <div className="absolute inset-0 bg-[var(--color-purple-500)]/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl -z-10" />
                    <Image
                        src={committee.image ? getImageUrl(committee.image) : '/img/newlogo.svg'}
                        alt={cleanedName}
                        fill
                        className="object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_20px_50px_rgba(139,92,246,0.3)]"
                        unoptimized
                        priority
                    />
                </div>
            </header>

            <section className="pt-12 border-t border-[var(--border-color)]/10">
                <div className="flex flex-col items-center mb-16">
                    <h2 className="flex items-center gap-4 text-4xl font-black text-[var(--text-main)] text-center">
                        <Users className="h-10 w-10 text-[var(--color-purple-500)] shrink-0" />
                        {isBestuur ? 'Het Bestuur' : 'De Commissie'}
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-transparent via-[var(--color-purple-500)] to-transparent rounded-full mt-6" />
                </div>

                <div className="grid gap-12 grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]">
                    {members.map((member, idx) => {
                        const name = member.user_id?.first_name ? `${member.user_id.first_name} ${member.user_id.last_name || ''}` : 'Lid';

                        return (
                            <div
                                key={idx}
                                className="group flex flex-col items-center"
                            >
                                <div className="relative mb-8 h-40 w-40 overflow-hidden squircle shadow-2xl ring-4 ring-[var(--bg-soft)] group-hover:ring-[var(--color-purple-500)]/40 transition-all duration-500">
                                    <Image
                                        src={member.user_id?.avatar ? getImageUrl(member.user_id.avatar) : '/img/newlogo.svg'}
                                        alt={name}
                                        fill
                                        className="object-cover transition-all duration-700 group-hover:scale-110"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h4 className="text-center font-black text-[var(--text-main)] text-xl mb-2 group-hover:text-[var(--color-purple-500)] transition-colors">
                                    {name}
                                </h4>
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] bg-[var(--bg-soft)] px-4 py-2 rounded-full border border-[var(--border-color)]/10 text-center shadow-inner">
                                    {member.is_leader ? (isBestuur ? member.user_id?.title : 'Commissieleider') : (isBestuur ? (member.user_id?.title || 'Bestuurslid') : 'Commissielid')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};