import type { StickerPublic } from '@salvemundi/validations';
import type { EnrichedUser } from '@/types/auth';
import { Trophy, Medal, Award } from 'lucide-react';

type StickerCreator = {
    id?: string | number;
    first_name?: string | null;
    last_name?: string | null;
    avatar?: string | null;
};

interface LeaderboardProps {
    stickers: StickerPublic[];
    currentUser?: EnrichedUser | null;
}

export default function Leaderboard({ stickers, currentUser }: LeaderboardProps) {
    const counts = new Map<string, { id: string; name: string; avatar?: string | null; count: number }>();

    for (const s of stickers) {
        const u = s.user_created as StickerCreator | null | undefined;
        const uid = u?.id ? String(u.id) : 'unknown';
        const name = u ? ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || uid : 'Unknown';

        const current = counts.get(uid) || { id: uid, name, avatar: u?.avatar ?? null, count: 0 };
        current.count += 1;
        counts.set(uid, current);
    }

    const leaderboard = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    const podium = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    // Reorder for podium display: [2, 1, 3]
    const podiumDisplay = [
        (podium[1] as typeof podium[0] | undefined) || null, // Silver
        (podium[0] as typeof podium[0] | undefined) || null, // Gold
        (podium[2] as typeof podium[0] | undefined) || null, // Bronze
    ];

    return (
        <div className="flex h-full flex-col rounded-2xl border border-border-color/20 bg-bg-card p-4 shadow-lg md:rounded-3xl md:p-6">
            <div className="mb-3 flex items-center justify-between md:mb-8">
                <div>
                    <h2 className="mt-0.5 text-xl font-black tracking-tight text-theme-purple md:text-2xl">Leaderboard</h2>
                </div>
                <Trophy className="size-6 animate-pulse text-orange-500" />
            </div>

            {leaderboard.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border-color/25 p-8 text-center">
                    <p className="text-sm font-medium text-text-muted italic">Geen plakkers gevonden...</p>
                </div>
            ) : (
                <>
                    {/* Podium Section */}
                    <div className="mb-4 grid grid-cols-3 items-end gap-2 px-2 md:mb-10">
                        {podiumDisplay.map((user, idx) => {
                            if (!user) return <div key={idx} />;

                            const isGold = idx === 1;
                            const isSilver = idx === 0;
                            const isMe = Boolean(currentUser && String(user.id) === String(currentUser.id));

                            return (
                                <div key={user.id} className="flex flex-col items-center">
                                    <div className="group relative mb-3">
                                        <div className={`
                                            absolute inset-0 rounded-full opacity-40 blur-md transition-opacity group-hover:opacity-60
                                            ${isGold ? 'bg-yellow-400' : isSilver ? 'bg-slate-300' : 'bg-orange-400'}
                                        `} />
                                        <div className={`
                                            relative flex size-12 items-center justify-center overflow-hidden rounded-full border-2 text-base font-semibold text-white md:size-16 md:text-lg
                                            ${isGold ? 'scale-110 border-yellow-400 bg-linear-to-br from-yellow-300 to-yellow-600' :
                                                isSilver ? 'border-slate-300 bg-linear-to-br from-slate-200 to-slate-400' :
                                                    'border-orange-400 bg-linear-to-br from-orange-300 to-orange-500'}
                                            ${isMe ? 'ring-2 ring-white ring-offset-2' : ''}
                                        `}>
                                            {user.name ? user.name.split(' ').map(x => x[0]).slice(0, 2).join('') : '#'}
                                        </div>
                                        <div className={`
                                            absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full shadow-lg
                                            ${isGold ? 'bg-yellow-500' : isSilver ? 'bg-slate-400' : 'bg-orange-500'}
                                        `}>
                                            {isGold ? <Trophy className="size-3 text-white" /> :
                                                isSilver ? <Medal className="size-3 text-white" /> :
                                                    <Award className="size-3 text-white" />}
                                        </div>
                                    </div>
                                    <div className="w-full min-w-0 px-1 text-center">
                                        <div className="truncate text-xs font-semibold text-(--text-main)">
                                            {user.name}
                                        </div>
                                        <div className={`text-[9px] font-bold md:text-[10px] ${isGold ? 'text-yellow-600' : isSilver ? 'text-slate-500' : 'text-orange-600'}`}>
                                            {user.count} stickers
                                        </div>
                                    </div>
                                    <div className={`
                                        mt-2 flex w-full items-center justify-center rounded-t-lg text-xs font-bold text-white
                                        ${isGold ? 'h-16 bg-linear-to-t from-yellow-500 to-yellow-400 md:h-20' :
                                            isSilver ? 'h-12 bg-linear-to-t from-slate-400 to-slate-300 md:h-16' :
                                                'h-8 bg-linear-to-t from-orange-500 to-orange-400 md:h-12'}
                                    `}>
                                        {isGold ? '1' : isSilver ? '2' : '3'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scrollable List */}
                    <div className="custom-scrollbar -mr-2 flex-1 overflow-y-auto pr-2">
                        <div className="space-y-1">
                            {rest.map((c, idx) => {
                                const isMe = Boolean(currentUser && String(c.id) === String(currentUser.id));
                                return (
                                    <div key={c.id} className={`group flex items-center justify-between rounded-xl p-2.5 transition-all duration-200 ${isMe ? 'border border-orange-500/20 bg-orange-500/10' : 'hover:bg-bg-main/50 border border-transparent'}`}>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-xs font-medium text-text-main transition-colors group-hover:text-theme-purple sm:text-sm">
                                                    {c.name}
                                                </div>
                                                <div className="mt-0.5 text-[10px] font-normal text-text-muted">
                                                    {c.count} sticker{c.count !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-text-muted/50 transition-colors group-hover:text-text-muted/80">
                                            #{idx + 4}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
