'use client';

import { useState, useEffect, useRef } from 'react';
import { Beer, Download, Grid, Search, Table as TableIcon, Users, Building2, ChevronDown, UserPlus } from 'lucide-react';

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
    onAddParticipant: () => void;
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
    onAddParticipant,
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

    const isAllSelected = enabledGroups.length === groupNames.length + 1;
    const isUnassignedSelected = enabledGroups.includes('unassigned');

    return (
        <div className="space-y-4 rounded-2xl border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-(--shadow-card)">
            <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
                {/* Tabs for Table/Groups View + Inline Stats */}
                <div className="flex w-full flex-wrap items-center gap-6 xl:w-auto">
                    <div className="flex rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) p-1">
                        <button
                            onClick={() => setViewMode('groups')}
                            className={`tab-button flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                viewMode === 'groups' ? 'bg-(--beheer-accent) text-white shadow-xs' : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-bg)/50 hover:text-(--beheer-text)'
                            }`}
                            type="button">
                            <Grid className="size-4" />
                            Groepen Weergave
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`tab-button flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                viewMode === 'table' ? 'bg-(--beheer-accent) text-white shadow-xs' : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-bg)/50 hover:text-(--beheer-text)'
                            }`}
                            type="button">
                            <TableIcon className="size-4" />
                            Tabel Weergave
                        </button>
                    </div>

                    {/* Inline Stats */}
                    <div className="flex flex-wrap items-center gap-4 border-l border-(--beheer-border) pl-4 text-xs font-semibold text-(--beheer-text-muted)">
                        <div className="flex items-center gap-1.5">
                            <Beer className="size-3.5 text-(--beheer-accent)" />
                            <span>Tickets: <strong className="text-(--beheer-text)">{totalTicketsCount}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span>Verenigingen: <strong className="text-(--beheer-text)">{totalAssociationsCount}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-end gap-3 xl:w-auto">
                    <button
                        onClick={onAddParticipant}
                        className="beheer-button flex cursor-pointer items-center gap-2 rounded-xl bg-(--beheer-accent) px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                        type="button">
                        <UserPlus className="size-4" />
                        Deelnemer Toevoegen
                    </button>

                    {groupNames.length > 0 && (
                        <button
                            onClick={onAutoDistribute}
                            disabled={isPending || !hasSignups}
                            className="beheer-button flex cursor-pointer items-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-5 py-2.5 text-xs font-semibold text-(--beheer-text) shadow-xs transition-all hover:bg-(--beheer-card-soft) active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                            type="button">
                            Automatisch verdelen
                        </button>
                    )}

                    <button
                        onClick={onExportCSV}
                        disabled={!hasSignups}
                        className="beheer-button flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        type="button">
                        <Download className="size-4" />
                        Exporteer CSV
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
                <div className="group flex flex-1 items-center gap-3 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 transition-all focus-within:border-(--beheer-accent) focus-within:ring-2 focus-within:ring-(--beheer-accent)/20">
                    <Search className="size-4 shrink-0 text-(--beheer-text-muted) transition-colors group-focus-within:text-(--beheer-accent)" />
                    <input
                        type="text"
                        placeholder="Zoek op naam, e-mail of vereniging..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className="beheer-input w-full border-none bg-transparent p-0 text-sm font-medium text-(--beheer-text) outline-none placeholder:text-(--beheer-text-muted) focus:ring-0"
                    />
                </div>

                {/* Group Filter Dropdown */}
                <div className="relative w-full md:w-64" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="group beheer-button flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 text-xs font-semibold text-(--beheer-text) shadow-xs transition-all hover:border-(--beheer-accent)/50 hover:bg-(--beheer-card-soft) focus:ring-2 focus:ring-(--beheer-accent)/20 focus:outline-none"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Users className="size-4 shrink-0 text-(--beheer-accent)" />
                            <span className="truncate">
                                {isAllSelected
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
                        <ChevronDown className={`size-4 text-(--beheer-text-muted) transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-(--beheer-accent)' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="animate-in fade-in zoom-in-95 absolute inset-x-0 z-50 mt-2 origin-top overflow-hidden rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) p-1.5 shadow-(--shadow-card-elevated) duration-150 focus:outline-none">
                            <div className="custom-scrollbar max-h-75 space-y-1 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allOptions = [...groupNames, 'unassigned'];
                                        if (isAllSelected) {
                                            setEnabledGroups([]);
                                        } else {
                                            setEnabledGroups(allOptions);
                                        }
                                    }}
                                    className={`beheer-button flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${
                                        isAllSelected
                                            ? 'bg-(--beheer-accent)/10 text-(--beheer-accent)'
                                            : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)'
                                    }`}
                                >
                                    <span>Alle groepen</span>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        readOnly
                                        className="size-3.5 cursor-pointer rounded border-(--beheer-border) accent-(--beheer-accent)"
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isUnassignedSelected) {
                                            setEnabledGroups(enabledGroups.filter(g => g !== 'unassigned'));
                                        } else {
                                            setEnabledGroups([...enabledGroups, 'unassigned']);
                                        }
                                    }}
                                    className={`beheer-button flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${
                                        isUnassignedSelected
                                            ? 'bg-(--beheer-accent)/10 text-(--beheer-accent)'
                                            : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)'
                                    }`}
                                >
                                    <span>Niet ingedeeld</span>
                                    <input
                                        type="checkbox"
                                        checked={isUnassignedSelected}
                                        readOnly
                                        className="size-3.5 cursor-pointer rounded border-(--beheer-border) accent-(--beheer-accent)"
                                    />
                                </button>
                                {groupNames.map((name) => {
                                    const isSelected = enabledGroups.includes(name);
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setEnabledGroups(enabledGroups.filter(g => g !== name));
                                                } else {
                                                    setEnabledGroups([...enabledGroups, name]);
                                                }
                                            }}
                                            className={`beheer-button flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${
                                                isSelected
                                                    ? 'bg-(--beheer-accent)/10 text-(--beheer-accent)'
                                                    : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)'
                                            }`}
                                        >
                                            <span className="truncate">{name}</span>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="size-3.5 cursor-pointer rounded border-(--beheer-border) accent-(--beheer-accent)"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
