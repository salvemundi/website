'use client';

import { 
    Users, 
    Search, 
    Mail, 
    ChevronRight 
} from 'lucide-react';
import { Input } from '@/shared/ui/Input';
import type { Committee } from '@/server/queries/commissies/admin-commissies.queries';

interface Props {
    committees: Committee[];
    selectedId: number | null;
    onSelect: (c: Committee) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    showAll: boolean;
    onShowAllChange: (all: boolean) => void;
}

const normalizeName = (name: string) =>
    name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim();

export default function CommitteeSidebar({
    committees,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    showAll,
    onShowAllChange
}: Props) {
    return (
        <div className="flex h-fit flex-col overflow-hidden rounded-(--beheer-radius) bg-(--beheer-card-bg) shadow-sm ring-1 ring-(--beheer-border)">
            <div className="border-b border-(--beheer-border)/50 p-6">
                <h2 className="mb-5 flex items-center gap-3 text-xs font-semibold text-(--beheer-text-muted)">
                    <Users className="size-4 text-(--beheer-accent)" />
                    {"Groepen & commissies"}
                </h2>
                
                <div className="space-y-4">
                    <div className="group relative">
                        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-(--beheer-text-muted) transition-colors group-focus-within:text-(--beheer-accent)" />
                        <Input
                            type="text"
                            placeholder="Zoek commissie..."
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full rounded-xl border-none bg-(--beheer-card-soft) py-3 pr-4 pl-11 text-sm font-semibold text-(--beheer-text) transition-all placeholder:text-(--beheer-text-muted) focus:ring-2 focus:ring-(--beheer-accent)/20"
                        />
                    </div>
                    <div className="flex rounded-xl border border-(--beheer-border)/50 bg-(--beheer-card-soft) p-1">
                        <button
                            onClick={() => onShowAllChange(false)}
                            className={`tab-button flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${!showAll ? 'bg-(--beheer-accent) text-white shadow-sm' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                        >
                            Kern
                        </button>
                        <button
                            onClick={() => onShowAllChange(true)}
                            className={`tab-button flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${showAll ? 'bg-(--beheer-accent) text-white shadow-sm' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                        >
                            Alles
                        </button>
                    </div>
                </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
                {committees.length === 0 ? (
                    <div className="py-16 text-center">
                        <Search className="mx-auto mb-3 size-10 text-(--beheer-text-muted) opacity-10" />
                        <p className="text-sm font-semibold text-(--beheer-text-muted) italic opacity-40">Geen resultaten</p>
                    </div>
                ) : (
                    committees.map(c => (
                        <button
                            key={c.id}
                            onClick={() => onSelect(c)}
                            className={`group beheer-button flex w-full items-center justify-between rounded-xl border-none p-4 transition-all ${selectedId === c.id
                                ? 'bg-(--beheer-accent) text-white shadow-(--shadow-glow)'
                                : 'bg-(--beheer-card-soft)/40 text-(--beheer-text) hover:translate-x-1 hover:bg-(--beheer-card-soft)'}`}
                        >
                            <div className="min-w-0 text-left">
                                <div className={`truncate text-sm font-semibold ${selectedId === c.id ? 'text-white' : 'text-(--beheer-text)'}`}>
                                    {normalizeName(c.name)}
                                </div>
                                {c.email && (
                                    <div className={`mt-1 flex items-center gap-1.5 truncate text-xs font-medium ${selectedId === c.id ? 'text-white/80' : 'text-(--beheer-text-muted)'}`}>
                                        <Mail className="size-3" />
                                        {c.email}
                                    </div>
                                )}
                            </div>
                            <ChevronRight className={`size-4 shrink-0 transition-transform ${selectedId === c.id ? 'translate-x-1 text-white' : 'text-(--beheer-text-muted) group-hover:text-(--beheer-text)'}`} />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}