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
        <div className="bg-(--bg-card) rounded-2xl shadow-(--shadow-card) ring-1 ring-(--border-color)/30 p-6 space-y-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                {/* Tabs for Table/Groups View + Inline Stats */}
                <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
                    <div className="flex bg-(--bg-main)/80 p-1 rounded-xl border border-(--border-color)/40">
                        <button
                            onClick={() => setViewMode('groups')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                                viewMode === 'groups' ? 'bg-(--theme-purple) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text-main)'
                            }`}
                        >
                            <Grid className="h-4 w-4" />
                            Groepen Weergave
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                                viewMode === 'table' ? 'bg-(--theme-purple) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text-main)'
                            }`}
                        >
                            <TableIcon className="h-4 w-4" />
                            Tabel Weergave
                        </button>
                    </div>

                    {/* Inline Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-(--text-muted) border-l border-(--border-color)/40 pl-4">
                        <div className="flex items-center gap-1.5">
                            <Beer className="h-3.5 w-3.5 text-(--theme-purple)" />
                            <span>Tickets: <strong className="text-(--text-main)">{totalTicketsCount}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Verenigingen: <strong className="text-(--text-main)">{totalAssociationsCount}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    {groupNames.length > 0 && (
                        <button
                            onClick={onAutoDistribute}
                            disabled={isPending || !hasSignups}
                            className="flex items-center gap-2 px-5 py-2.5 bg-(--theme-purple) hover:opacity-90 text-white font-semibold text-xs rounded-xl shadow-lg shadow-(--theme-purple)/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <Sparkles className="h-4 w-4 animate-pulse" />
                            Automatisch verdelen
                        </button>
                    )}

                    <button
                        onClick={onExportCSV}
                        disabled={!hasSignups}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-green-600/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--text-muted) group-focus-within:text-(--theme-purple) transition-colors" />
                    <input
                        type="text"
                        placeholder="Zoek op naam, e-mail of vereniging..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full pl-12 pr-4 py-3 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-medium text-sm text-(--text-main)"
                    />
                </div>

                {/* Group Filter */}
                <div className="w-full md:w-64 relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between gap-2 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl px-4 py-3 text-xs font-semibold text-(--text-main) hover:border-(--theme-purple)/40 transition-all cursor-pointer focus:outline-none"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Users className="h-4 w-4 text-(--text-muted) shrink-0" />
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
                        <ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-(--theme-purple)' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute left-0 right-0 z-50 mt-1 origin-top rounded-xl border border-(--border-color)/30 bg-(--bg-card) p-1 shadow-2xl ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-100">
                            <div className="max-h-[80vh] overflow-y-auto space-y-0.5">
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
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-(--bg-main) text-(--text-main) transition-colors flex items-center justify-between"
                                >
                                    <span>Alle groepen</span>
                                    <input
                                        type="checkbox"
                                        checked={enabledGroups.length === groupNames.length + 1}
                                        readOnly
                                        className="rounded border-(--border-color) text-(--theme-purple) focus:ring-(--theme-purple)/20 cursor-pointer h-3.5 w-3.5"
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
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-(--bg-main) text-(--text-main) transition-colors flex items-center justify-between"
                                >
                                    <span>Niet ingedeeld</span>
                                    <input
                                        type="checkbox"
                                        checked={enabledGroups.includes('unassigned')}
                                        readOnly
                                        className="rounded border-(--border-color) text-(--theme-purple) focus:ring-(--theme-purple)/20 cursor-pointer h-3.5 w-3.5"
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
                                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-(--bg-main) text-(--text-main) transition-colors flex items-center justify-between"
                                    >
                                        <span className="truncate">{name}</span>
                                        <input
                                            type="checkbox"
                                            checked={enabledGroups.includes(name)}
                                            readOnly
                                            className="rounded border-(--border-color) text-(--theme-purple) focus:ring-(--theme-purple)/20 cursor-pointer h-3.5 w-3.5"
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
