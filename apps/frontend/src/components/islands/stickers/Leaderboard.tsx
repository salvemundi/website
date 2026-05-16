import type { StickerPublic } from '@salvemundi/validations';
import type { EnrichedUser } from '@/types/auth';
import { Trophy, Medal, Award } from 'lucide-react';

type StickerCreator = {
    id?: string | number;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
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
        const name = u ? ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || u.email || uid : 'Unknown';
        
        const current = counts.get(uid) || { id: uid, name, avatar: u?.avatar ?? null, count: 0 };
        current.count += 1;
        counts.set(uid, current);
    }

    const leaderboard = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    const podium = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    // Reorder for podium display: [2, 1, 3]
    const podiumDisplay = [
        podium[1] || null, // Silver
        podium[0] || null, // Gold
        podium[2] || null, // Bronze
    ];

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-paars/60">Community</p>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-paars">Leaderboard</h2>
                </div>
                <Trophy className="h-6 w-6 text-oranje animate-pulse" />
            </div>

            {leaderboard.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center border-2 border-dashed border-paars/10 rounded-2xl">
                    <p className="text-sm text-theme-muted font-medium italic">Geen plakkers gevonden...</p>
                </div>
            ) : (
                <>
                    {/* Podium Section */}
                    <div className="grid grid-cols-3 gap-2 items-end mb-10 px-2">
                        {podiumDisplay.map((user, idx) => {
                            if (!user) return <div key={idx} />;
                            
                            const isGold = idx === 1;
                            const isSilver = idx === 0;
                            const isMe = Boolean(currentUser && String(user.id) === String(currentUser.id));

                            return (
                                <div key={user.id} className="flex flex-col items-center">
                                    <div className="relative mb-3 group">
                                        <div className={`
                                            absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity
                                            ${isGold ? 'bg-yellow-400' : isSilver ? 'bg-slate-300' : 'bg-orange-400'}
                                        `} />
                                        <div className={`
                                            relative w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-white font-black text-lg md:text-xl overflow-hidden
                                            ${isGold ? 'border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-600 scale-110' : 
                                              isSilver ? 'border-slate-300 bg-gradient-to-br from-slate-200 to-slate-400' : 
                                              'border-orange-400 bg-gradient-to-br from-orange-300 to-orange-500'}
                                            ${isMe ? 'ring-2 ring-white ring-offset-2' : ''}
                                        `}>
                                            {user.name ? user.name.split(' ').map(x => x[0]).slice(0, 2).join('') : '#'}
                                        </div>
                                        <div className={`
                                            absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg
                                            ${isGold ? 'bg-yellow-500' : isSilver ? 'bg-slate-400' : 'bg-orange-500'}
                                        `}>
                                            {isGold ? <Trophy className="h-3 w-3 text-white" /> : 
                                             isSilver ? <Medal className="h-3 w-3 text-white" /> : 
                                             <Award className="h-3 w-3 text-white" />}
                                        </div>
                                    </div>
                                    <div className="text-center min-w-0 w-full px-1">
                                        <div className="text-[10px] md:text-xs font-black truncate uppercase tracking-tighter text-paars">
                                            {user.name}
                                        </div>
                                        <div className={`text-[9px] md:text-[10px] font-bold ${isGold ? 'text-yellow-600' : isSilver ? 'text-slate-500' : 'text-orange-600'}`}>
                                            {user.count} stickers
                                        </div>
                                    </div>
                                    <div className={`
                                        mt-2 w-full rounded-t-lg flex items-center justify-center font-black text-white text-xs
                                        ${isGold ? 'h-16 md:h-20 bg-gradient-to-t from-yellow-500 to-yellow-400' : 
                                          isSilver ? 'h-12 md:h-16 bg-gradient-to-t from-slate-400 to-slate-300' : 
                                          'h-8 md:h-12 bg-gradient-to-t from-orange-500 to-orange-400'}
                                    `}>
                                        {isGold ? '1' : isSilver ? '2' : '3'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                        <div className="space-y-1">
                            {rest.map((c, idx) => {
                                const isMe = Boolean(currentUser && String(c.id) === String(currentUser.id));
                                return (
                                    <div key={c.id} className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 ${isMe ? 'bg-oranje/10 border border-oranje/20' : 'hover:bg-paars/5 border border-transparent'}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-paars/10 to-paars/5 border border-paars/10 flex items-center justify-center text-paars font-black text-[10px] tracking-tighter`}>
                                                    {c.name ? c.name.split(' ').map(x => x[0]).slice(0, 2).join('') : '#'}
                                                </div>
                                                {isMe && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-oranje rounded-full border-2 border-[var(--bg-card)]" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-paars truncate group-hover:text-oranje transition-colors uppercase tracking-tight">
                                                    {c.name}
                                                </div>
                                                <div className="text-[10px] font-medium text-paars/50">
                                                    {c.count} sticker{c.count !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-paars/30 group-hover:text-paars/60 transition-colors">
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

