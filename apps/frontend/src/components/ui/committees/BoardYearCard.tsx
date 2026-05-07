import React from 'react';
import Image from 'next/image';
import { type Board } from '@salvemundi/validations/schema/board.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { User, Shield } from 'lucide-react';

interface BoardYearCardProps {
    board: Board;
}

export const BoardYearCard: React.FC<BoardYearCardProps> = ({ board }) => {
    return (
        <div className="group relative overflow-hidden squircle-xl bg-[var(--bg-card)] p-8 shadow-2xl transition-all duration-500 hover:shadow-purple-500/10 dark:border dark:border-white/10 dark:hover:border-purple-500/30">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-purple-500)]/5 blur-3xl transition-opacity duration-700 group-hover:opacity-100 opacity-0" />

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Left: Image Container */}
                <div className="relative w-full lg:w-[400px] aspect-[4/3] squircle-xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                    <Image
                        src={board.image ? (getImageUrl(board.image) ?? '/img/newlogo.svg') : '/img/newlogo.svg'}
                        alt={board.naam || 'Bestuur'}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                        <span className="text-white font-black tracking-widest text-sm uppercase">{board.year}</span>
                    </div>
                </div>

                {/* Right: Info Content */}
                <div className="flex-1 space-y-6">
                    <div>
                        <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-purple-500)]/10 text-[var(--color-purple-600)] dark:text-purple-400 text-xs font-black tracking-widest uppercase mb-3 ring-1 ring-[var(--color-purple-500)]/20">
                            {board.year}
                        </div>
                        <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                            {board.naam}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {board.members?.map((member, idx) => {
                            const name = member.name || (member.user_id ? `${member.user_id.first_name} ${member.user_id.last_name}` : 'Onbekend');
                            const isLeader = member.functie?.toLowerCase().includes('voorzitter');
                            
                            return (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 group-hover:border-purple-500/20 transition-all">
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-purple-500/10">
                                        {member.user_id?.avatar ? (
                                            <Image
                                                src={getImageUrl(member.user_id.avatar) ?? '/img/newlogo.svg'}
                                                alt={name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-purple-500/5 text-purple-500">
                                                {isLeader ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[var(--text-main)] truncate">{name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-purple-600)] dark:text-purple-400 opacity-80">
                                            {member.functie || 'Bestuurslid'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
