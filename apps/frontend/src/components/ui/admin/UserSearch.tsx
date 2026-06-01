'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Check, User, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { searchMembersAction } from '@/server/actions/admin/aanmeldingen.actions';
import { type UserBasic } from '@/server/internal/user-db.utils';
import { cn } from '@/lib/utils/cn';
import { safeConsoleError } from '@/server/utils/logger';

interface UserSearchProps {
    onSelect: (user: UserBasic) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    disabled?: boolean;
}

export default function UserSearch({
    onSelect,
    placeholder = "Zoek lid op naam of email...",
    className,
    autoFocus = false,
    disabled = false
}: UserSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserBasic[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const res = await searchMembersAction(debouncedQuery);
                if (res.success) {
                    setResults(res.data);
                    setIsOpen(true);
                } else {
                    setResults([]);
                }
            } catch (error) {
                safeConsoleError('[UserSearch.tsx][fetchResults] Fout bij het ophalen van zoekresultaten', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchResults();
    }, [debouncedQuery]);

    const handleSelect = (user: UserBasic) => {
        onSelect(user);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative group w-full", className)} ref={containerRef}>
            <div className="relative">
                <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors z-20",
                    isOpen ? "text-theme-purple" : "text-text-muted opacity-50"
                )} />
                <input
                    type="text"
                    inputMode="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    className="beheer-input !pl-11 pr-12 py-4 text-xs font-semibold placeholder:text-text-muted placeholder:opacity-40 focus:ring-4 focus:ring-theme-purple/10"
                    autoComplete="off"
                />

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-theme-purple" />
                    )}
                    {!isLoading && query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setResults([]); }}
                            className="p-1 hover:bg-bg-soft rounded-lg text-text-muted hover:text-text-main transition-all"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && (query.length >= 2) && (
                <div className="absolute z-[100] mt-3 w-full bg-bg-card border border-border-color rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-xl">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-theme-purple/30 to-transparent" />

                    {results.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
                            <div className="px-3 py-2 mb-1">
                                <span className="text-[9px] font-bold text-text-muted opacity-50">Resultaten</span>
                            </div>
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelect(user)}
                                    className="w-full text-left p-3.5 hover:bg-theme-purple/10 rounded-2xl group transition-all flex items-center justify-between border border-transparent hover:border-theme-purple/10"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-bg-soft flex items-center justify-center text-text-muted font-semibold text-xs shadow-inner ring-1 ring-border-color/50 group-hover:bg-theme-purple group-hover:text-white transition-all">
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-text-main text-sm tracking-tight truncate">
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <span className="text-[10px] font-medium text-text-muted opacity-60 truncate">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-theme-purple/0 group-hover:bg-theme-purple text-white transition-all">
                                        <Check className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center bg-bg-soft/20">
                            {!isLoading && (
                                <>
                                    <div className="h-12 w-12 bg-bg-soft rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-color/50 shadow-inner">
                                        <User className="h-6 w-6 text-text-muted opacity-20" />
                                    </div>
                                    <p className="text-xs font-semibold text-text-muted opacity-40 italic">Geen lid gevonden met deze naam...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}