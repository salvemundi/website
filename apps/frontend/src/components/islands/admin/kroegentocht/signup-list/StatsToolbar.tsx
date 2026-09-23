'use client';

import { useState, useEffect, useRef } from 'react';
import { Beer, Download, Grid, Search, Sparkles, Table as TableIcon, Users, Building2, ChevronDown } from 'lucide-react';

interface StatsToolbarProps {
    viewMode: 'table' | 'groups';
    setViewMode: (mode: 'table' | 'groups') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    enabledGroups: string[];
    setEnabledGroups: (groups: string[]) => void;
    totalTicketsCount: number;
    totalAssociationsCount: number;
    groupNames: string[];
    isPending: boolean;
    onAutoDistribute: () => void;
    onExportCSV: () => void;
    hasSignups: boolean;
}

export default function StatsToolbar({
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    enabledGroups,
    setEnabledGroups,
    totalTicketsCount,
    totalAssociationsCount,
    groupNames,
    isPending,
    onAutoDistribute,
    onExportCSV,
    hasSignups
}: StatsToolbarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-4 rounded-2xl bg-(--bg-card) p-6 shadow-(--shadow-card) ring-1 ring-(--border-color)/30">
            <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
                {/* Tabs for Table/Groups View + Inline Stats */}
                <div className="flex w-full flex-wrap items-center gap-6 xl:w-auto">
                    <div className="flex rounded-xl border border-(--border-color)/40 bg-(--bg-main)/80 p-1">
                        <button
                            onClick={() => setViewMode('groups')}
                            className={`tab-button flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                viewMode === 'groups' ? 'bg-(--theme-purple) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text-main)'
                            }`}
                        >
                            <Grid className="size-4" />
                            Groepen Weergave
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`tab-button flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                viewMode === 'table' ? 'bg-(--theme-purple) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text-main)'
                            }`}
                        >
                            <TableIcon className="size-4" />
                            Tabel Weergave
                        </button>
                    </div>

                    {/* Inline Stats */}
                    <div className="flex flex-wrap items-center gap-4 border-l border-(--border-color)/40 pl-4 text-xs font-semibold text-(--text-muted)">
                        <div className="flex items-center gap-1.5">
                            <Beer className="size-3.5 text-(--theme-purple)" />
                            <span>Tickets: <strong className="text-(--text-main)">{totalTicketsCount}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-emerald-500" />
                            <span>Verenigingen: <strong className="text-(--text-main)">{totalAssociationsCount}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-end gap-3 xl:w-auto">
                    {groupNames.length > 0 && (
                        <button
                            onClick={onAutoDistribute}
                            disabled={isPending || !hasSignups}
                            className="beheer-button flex cursor-pointer items-center gap-2 rounded-xl bg-(--theme-purple) px-5 py-2.5 text-xs font-semibold text-white shadow-(--theme-purple)/10 shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        >
                            <Sparkles className="size-4 animate-pulse" />
                            Automatisch verdelen
                        </button>
                    )}

                    <button
                        onClick={onExportCSV}
                        disabled={!hasSignups}
                        className="beheer-button flex cursor-pointer items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-green-600/10 transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
                    >
                        <Download className="size-4" />
                        Exporteer CSV
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-4 py-3 transition-all focus-within:border-(--theme-purple) focus-within:ring-4 focus-within:ring-(--theme-purple)/10">
                    <Search className="size-5 shrink-0 text-(--text-muted) transition-colors group-focus-within:text-(--theme-purple)" />
                    <input
                        type="text"
                        placeholder="Zoek op naam, e-mail of vereniging..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className="beheer-input w-full border-none bg-transparent p-0 text-sm font-medium text-(--text-main) outline-none"
                    />
                </div>

                {/* Group Filter */}
                <div className="relative w-full md:w-64" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="beheer-button flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-4 py-3 text-xs font-semibold text-(--text-main) transition-all hover:border-(--theme-purple)/40 focus:outline-none"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Users className="size-4 shrink-0 text-(--text-muted)" />
                            <span className="truncate">
                                {enabledGroups.length === groupNames.length + 1
                                    ? 'Alle groepen'
                                    : enabledGroups.length === 0
                                    ? 'Geen groepen'
                                    : enabledGroups.length === 1
                                    ? enabledGroups[0] === 'unassigned'
                                        ? 'Niet ingedeeld'
                                        : enabledGroups[0]
                                    : `${enabledGroups.length} geselecteerd`}
                            </span>
                        </div>
                        <ChevronDown className={`size-4 text-(--text-muted) transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-(--theme-purple)' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="animate-in fade-in slide-in-from-top-1 absolute inset-x-0 z-50 mt-1 origin-top rounded-xl border border-(--border-color)/30 bg-(--bg-card) p-1 shadow-2xl ring-1 ring-black/5 duration-100 focus:outline-none">
                            <div className="max-h-[80vh] space-y-0.5 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allOptions = [...groupNames, 'unassigned'];
                                        if (enabledGroups.length === allOptions.length) {
                                            setEnabledGroups([]);
                                        } else {
                                            setEnabledGroups(allOptions);
                                        }
                                    }}
                                    className="beheer-button flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-main)"
                                >
                                    <span>Alle groepen</span>
                                    <input
                                        type="checkbox"
                                        checked={enabledGroups.length === groupNames.length + 1}
                                        readOnly
                                        className="size-3.5 cursor-pointer rounded border-(--border-color) text-(--theme-purple) focus:ring-(--theme-purple)/20"
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (enabledGroups.includes('unassigned')) {
                                            setEnabledGroups(enabledGroups.filter(g => g !== 'unassigned'));
                                        } else {
                                            setEnabledGroups([...enabledGroups, 'unassigned']);
                                        }
                                    }}
                                    className="beheer-button flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-main)"
                                >
                                    <span>Niet ingedeeld</span>
                                    <input
                                        type="checkbox"
                                        checked={enabledGroups.includes('unassigned')}
                                        readOnly
                                        className="size-3.5 cursor-pointer rounded border-(--border-color) text-(--theme-purple) focus:ring-(--theme-purple)/20"
                                    />
                                </button>
                                {groupNames.map((name) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => {
                                            if (enabledGroups.includes(name)) {
                                                setEnabledGroups(enabledGroups.filter(g => g !== name));
                                            } else {
                                                setEnabledGroups([...enabledGroups, name]);
                                            }
                                        }}
                                        className="beheer-button flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-main)"
                                    >
                                        <span className="truncate">{name}</span>
                                        <input
                                            type="checkbox"
                                            checked={enabledGroups.includes(name)}
                                            readOnly
                                            className="size-3.5 cursor-pointer rounded border-(--border-color) text-(--theme-purple) focus:ring-(--theme-purple)/20"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
