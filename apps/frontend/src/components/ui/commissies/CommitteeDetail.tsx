import Image from 'next/image';
import Link from 'next/link';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Mail, Users, History, LayoutGrid } from 'lucide-react';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

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
            <header className="grid w-full grid-cols-1 items-center px-[5%] pt-4 @[900px]:grid-cols-[45%_10%_45%] @[900px]:items-start">
                <div className="order-2 flex w-full min-w-0 flex-col items-center text-center @[900px]:order-1 @[900px]:items-start @[900px]:pt-8 @[900px]:text-left">
                    <h1 className="leading-1.1 mb-4 text-2xl font-black tracking-tight text-purple-700 @[1000px]:text-4xl @[1200px]:text-5xl dark:text-purple-300">
                        {cleanedName}
                    </h1>

                    <div className="mb-6 max-w-2xl text-xl leading-relaxed font-medium text-(--text-muted)">
                        {committee.description || `De ${cleanedName} van Salve Mundi zet zich dagelijks in om de vereniging naar een hoger niveau te tillen en memorabele momenten te creëren voor al onze leden.`}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 @[900px]:justify-start">
                        {committee.email && (
                            <a
                                href={`mailto:${committee.email}`}
                                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-purple-600 px-8 py-3 text-lg font-black text-white shadow-xl shadow-purple-600/20 transition-all hover:bg-purple-500 active:scale-95"
                            >
                                <Mail className="size-5" />
                                Interesse? Mail ons!
                            </a>
                        )}

                        {isBestuur ? (
                            <Link
                                href="/commissies/oud-besturen"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-(--border-color)/50 px-8 py-3 text-lg font-bold text-(--text-muted) transition-all hover:border-(--border-color) hover:text-(--text-main)"
                            >
                                <History className="size-5" />
                                Geschiedenis
                            </Link>
                        ) : (
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-(--border-color)/50 px-8 py-3 text-lg font-bold text-(--text-muted) transition-all hover:border-(--border-color) hover:text-(--text-main)"
                            >
                                <LayoutGrid className="size-5" />
                                Andere vragen?
                            </Link>
                        )}
                    </div>
                </div>

                <div className="order-1 hidden @[900px]:order-2 @[900px]:block" />

                <div className="relative order-1 mx-auto aspect-square w-full shrink-0 @[900px]:order-3 @[900px]:ml-auto">
                    {committee.image ? (
                        <Image
                            src={getImageUrl(committee.image)}
                            alt={cleanedName}
                            fill
                            className="object-contain drop-shadow-[0_20px_50px_rgba(139,92,246,0.3)]"
                            priority
                        />
                    ) : (
                        <FallbackLogo className="object-contain opacity-60 drop-shadow-[0_20px_50px_rgba(139,92,246,0.3)]" />
                    )}
                </div>
            </header>

            <section className="border-t border-(--border-color)/20 pt-12">
                <div className="mb-16 flex flex-col items-center">
                    <h2 className="flex items-center gap-4 text-center text-3xl font-black text-purple-700 sm:text-4xl dark:text-purple-300">
                        <Users className="size-10 shrink-0 text-purple-500 dark:text-purple-400" />
                        {isBestuur ? 'Het Bestuur' : 'De Commissie'}
                    </h2>
                    <div className="mt-6 h-1.5 w-24 rounded-full bg-linear-to-r from-transparent via-purple-500 to-transparent" />
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-10 sm:gap-12">
                    {members.map((member, idx) => {
                        const name = member.user_id?.first_name ? `${member.user_id.first_name} ${member.user_id.last_name || ''}` : 'Lid';

                        return (
                            <div
                                key={idx}
                                className="flex flex-col items-center"
                            >
                                <div className="relative mb-6 size-36 overflow-hidden rounded-3xl shadow-xl ring-4 ring-(--bg-soft) sm:size-40">
                                    {member.user_id?.avatar ? (
                                        <Image
                                            src={getImageUrl(member.user_id.avatar)}
                                            alt={name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <FallbackLogo className="object-contain p-4 opacity-45" />
                                    )}
                                </div>
                                <h3 className="mb-2 text-center text-lg font-black text-(--text-main) sm:text-xl">
                                    {name}
                                </h3>
                                <span className="rounded-full border border-(--border-color)/20 bg-(--bg-soft) px-4 py-1.5 text-center text-[10px] font-bold text-(--text-muted)">
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