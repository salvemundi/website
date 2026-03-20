'use client';

import { 
    MapPin, 
    Globe, 
    Award, 
    TrendingUp 
} from 'lucide-react';

interface StickerStatsProps {
    stickers: any[];
}

export default function StickerStats({ stickers }: StickerStatsProps) {
    const total = stickers.length;
    
    const countries = new Set(stickers.map(s => s.country?.toLowerCase()).filter(Boolean)).size;
    const cities = new Set(stickers.map(s => s.city?.toLowerCase()).filter(Boolean)).size;
    
    // Top country calculation
    const countryCounts: Record<string, number> = {};
    stickers.forEach(s => {
        if (s.country) {
            countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
        }
    });
    
    const topCountry = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    const stats = [
        { 
            label: 'Totaal Stickers', 
            value: total, 
            icon: MapPin, 
            color: 'text-purple-500', 
            bg: 'bg-purple-500/10' 
        },
        { 
            label: 'Landen', 
            value: countries, 
            icon: Globe, 
            color: 'text-blue-500', 
            bg: 'bg-blue-500/10' 
        },
        { 
            label: 'Steden', 
            value: cities, 
            icon: Award, 
            color: 'text-green-500', 
            bg: 'bg-green-500/10' 
        },
        { 
            label: 'Top Land', 
            value: topCountry[0], 
            icon: TrendingUp, 
            color: 'text-amber-500', 
            bg: 'bg-amber-500/10',
            subtitle: `${topCountry[1]} stickers`
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
                <div key={i} className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 hover:ring-[var(--theme-purple)]/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-[var(--radius-xl)] ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        {stat.subtitle && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                {stat.subtitle}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-[var(--text-main)] tracking-tighter transition-all group-hover:text-[var(--theme-purple)]">
                            {stat.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
