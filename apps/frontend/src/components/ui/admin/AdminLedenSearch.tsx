'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Check, User, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { searchMembersAction } from '@/server/actions/admin/activiteiten/admin-activiteiten-signups.actions';
import { type UserBasic } from '@salvemundi/validations';
import { cn } from '@/lib/utils/cn';
import { safeConsoleError } from '@/server/utils/logger';

interface AdminLedenSearchProps {
    onSelect: (user: UserBasic) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    disabled?: boolean;
}

export default function AdminLedenSearch({
    onSelect,
    placeholder = "Zoek lid op naam of email...",
    className,
    autoFocus = false,
    disabled = false
}: AdminLedenSearchProps) {
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
                safeConsoleError('[UserSearch.tsx][UserSearch] Fout bij het ophalen van zoekresultaten', error);
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
        <div className={cn("group relative w-full", className)} ref={containerRef}>
            <div className="relative">
                <Search className={cn(
                    "absolute top-1/2 left-4 z-20 size-4 -translate-y-1/2 transition-colors",
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
                    className="beheer-input py-4 pr-12 pl-11! text-xs font-semibold placeholder:text-text-muted placeholder:opacity-40 focus:ring-4 focus:ring-theme-purple/10"
                    autoComplete="off"
                />

                <div className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-2">
                    {isLoading && (
                        <Loader2 className="size-4 animate-spin text-theme-purple" />
                    )}
                    {!isLoading && query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setResults([]); }}
                            className="rounded-lg p-1 text-text-muted transition-all hover:bg-bg-soft hover:text-text-main"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && (query.length >= 2) && (
                <div className="animate-in fade-in slide-in-from-top-4 absolute z-100 mt-3 w-full overflow-hidden rounded-3xl border border-border-color bg-bg-card shadow-2xl backdrop-blur-xl duration-300">
                    <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-theme-purple/30 to-transparent" />

                    {results.length > 0 ? (
                        <div className="custom-scrollbar max-h-72 overflow-y-auto p-2">
                            <div className="mb-1 px-3 py-2">
                                <span className="text-[9px] font-bold text-text-muted opacity-50">Resultaten</span>
                            </div>
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelect(user)}
                                    className="group flex w-full items-center justify-between rounded-2xl border border-transparent p-3.5 text-left transition-all hover:border-theme-purple/10 hover:bg-theme-purple/10"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-soft text-xs font-semibold text-text-muted shadow-inner ring-1 ring-border-color/50 transition-all group-hover:bg-theme-purple group-hover:text-white">
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-semibold tracking-tight text-text-main">
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <span className="truncate text-[10px] font-medium text-text-muted opacity-60">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex size-8 items-center justify-center rounded-full bg-theme-purple/0 text-white transition-all group-hover:bg-theme-purple">
                                        <Check className="size-4 opacity-0 group-hover:opacity-100" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-bg-soft/20 p-10 text-center">
                            {!isLoading && (
                                <>
                                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-border-color/50 bg-bg-soft shadow-inner">
                                        <User className="size-6 text-text-muted opacity-20" />
                                    </div>
                                    <p className="text-xs font-semibold text-text-muted italic opacity-40">Geen lid gevonden met deze naam...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}