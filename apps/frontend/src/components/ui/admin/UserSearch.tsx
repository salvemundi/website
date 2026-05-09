'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Check, User, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { searchMembersAction } from '@/server/actions/aanmeldingen.actions';
import { type UserBasic } from '@salvemundi/validations';
import { cn } from '@/lib/utils/cn';

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

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch results
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
                if (res.success && res.data) {
                    setResults(res.data);
                    setIsOpen(true);
                } else {
                    setResults([]);
                }
            } catch (err) {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
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
                    isOpen ? "text-[var(--beheer-accent)]" : "text-[var(--beheer-text-muted)] opacity-50"
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
                    className="beheer-input !pl-11 pr-12 py-4 text-xs font-semibold placeholder:text-[var(--beheer-text-muted)] placeholder:opacity-40 focus:ring-4 focus:ring-[var(--beheer-accent)]/10"
                    autoComplete="off"
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--beheer-accent)]" />
                    )}
                    {!isLoading && query && (
                        <button 
                            type="button"
                            onClick={() => { setQuery(''); setResults([]); }}
                            className="p-1 hover:bg-[var(--beheer-card-soft)] rounded-lg text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-all"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && (query.length >= 2) && (
                <div className="absolute z-[100] mt-3 w-full bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-xl">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--beheer-accent)]/30 to-transparent" />
                    
                    {results.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
                            <div className="px-3 py-2 mb-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50">Resultaten</span>
                            </div>
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelect(user)}
                                    className="w-full text-left p-3.5 hover:bg-[var(--beheer-accent)]/10 rounded-2xl group transition-all flex items-center justify-between border border-transparent hover:border-[var(--beheer-accent)]/10"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--beheer-card-soft)] flex items-center justify-center text-[var(--beheer-text-muted)] font-semibold text-xs shadow-inner ring-1 ring-[var(--beheer-border)]/50 group-hover:bg-[var(--beheer-accent)] group-hover:text-white transition-all">
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-[var(--beheer-text)] text-sm tracking-tight truncate">
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <span className="text-[10px] font-medium text-[var(--beheer-text-muted)] opacity-60 truncate">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[var(--beheer-accent)]/0 group-hover:bg-[var(--beheer-accent)] text-white transition-all">
                                        <Check className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center bg-[var(--beheer-card-soft)]/20">
                            {!isLoading && (
                                <>
                                    <div className="h-12 w-12 bg-[var(--beheer-card-soft)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--beheer-border)]/50 shadow-inner">
                                        <User className="h-6 w-6 text-[var(--beheer-text-muted)] opacity-20" />
                                    </div>
                                    <p className="text-xs font-semibold text-[var(--beheer-text-muted)] opacity-40 italic">Geen lid gevonden met deze naam...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
