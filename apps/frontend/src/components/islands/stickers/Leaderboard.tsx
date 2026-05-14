import type { StickerPublic } from '@salvemundi/validations';
import type { EnrichedUser } from '@/types/auth';

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
        const existing = counts.get(uid);
        if (existing) {
            existing.count += 1;
        } else {
            counts.set(uid, { id: uid, name, avatar: u?.avatar ?? null, count: 1 });
        }
    }

    const leaderboard = Array.from(counts.values()).sort((a, b) => b.count - a.count);

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 mt-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-paars">Leaderboard</h2>
            {leaderboard.length === 0 ? (
                <p className="text-sm text-theme-muted">No contributors yet</p>
            ) : (
                <div className="max-h-96 overflow-y-auto pr-2">
                    <ol className="space-y-2">
                        {leaderboard.slice(0, 50).map((c, idx) => {
                            const isMe = Boolean(currentUser && String(c.id) === String(currentUser.id));
                            return (
                                <li key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${isMe ? 'bg-oranje/10' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                            {c.name ? c.name.split(' ').map(x => x[0]).slice(0,2).join('') : '#'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{c.name}</div>
                                            <div className="text-xs text-theme-muted">{c.count} sticker{c.count !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-paars">#{idx + 1}</div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}
        </div>
    );
}
