import Image from 'next/image';
import { type Board } from '@salvemundi/validations/schema/board.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { User, Medal } from 'lucide-react';

import { BRAND_CONFIG } from '@/lib/config/brand';

interface BoardYearCardProps {
    board: Board;
}

export const BoardYearCard = ({ board }: BoardYearCardProps) => {
    return (
        <section className="relative overflow-hidden rounded-2xl bg-(--bg-card) p-6 shadow-xl sm:rounded-3xl sm:p-8 dark:border dark:border-white/10">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
                <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 sm:rounded-2xl lg:w-100 dark:ring-white/10">
                    {!board.image ? (
                        <>
                            <Image
                                src={BRAND_CONFIG.logoFallbackLight}
                                alt={board.naam || 'Bestuur'}
                                fill
                                className="object-contain p-6 opacity-40 dark:hidden"
                            />
                            <Image
                                src={BRAND_CONFIG.logoFallbackDark}
                                alt={board.naam || 'Bestuur'}
                                fill
                                className="hidden object-contain p-6 opacity-40 dark:block"
                            />
                        </>
                    ) : (
                        <Image
                            src={getImageUrl(board.image)}
                            alt={board.naam || 'Bestuur'}
                            fill
                            className="object-cover"
                        />
                    )}
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <div className="mb-3 inline-block rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                            {board.year}
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-purple-700 sm:text-3xl dark:text-purple-300">
                            {board.naam}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        {board.members?.map((member, idx) => {
                            const name = member.name || (member.user_id ? `${member.user_id.first_name} ${member.user_id.last_name}` : 'Onbekend');
                            const isLeader = member.functie?.toLowerCase().includes('voorzitter');

                            return (
                                <div key={idx} className="flex items-center gap-3 rounded-xl border border-(--border-color)/30 bg-(--bg-main)/50 p-3 sm:rounded-2xl">
                                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-purple-500/10">
                                        {member.user_id?.avatar ? (
                                            <Image
                                                src={getImageUrl(member.user_id.avatar)}
                                                alt={name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center bg-purple-500/5 text-purple-600 dark:text-purple-400">
                                                {isLeader ? <Medal className="size-4" /> : <User className="size-4" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-(--text-main)">{name}</p>
                                        <p className="text-[10px] font-bold text-purple-700 opacity-80 dark:text-purple-300">
                                            {member.functie || 'Bestuurslid'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};