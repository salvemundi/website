'use client';

import { Shield, Save, Loader2, Check, X } from 'lucide-react';
import GroupSelector from './GroupSelector';

interface PermissionCardProps {
    id: string;
    label: string;
    description: string;
    pageKey: string;
    currentTokens: string[];
    allCommittees: any[];
    showAllGroups: boolean;
    isSaving: boolean;
    saveStatus: 'success' | 'error' | null;
    onToggleToken: (pageKey: string, token: string) => void;
    onSave: (pageKey: string) => void;
}

export default function PermissionCard({
    label,
    description,
    pageKey,
    currentTokens,
    allCommittees,
    showAllGroups,
    isSaving,
    saveStatus,
    onToggleToken,
    onSave
}: PermissionCardProps) {
    return (
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)] overflow-hidden transition-all hover:ring-[var(--theme-purple)]/30">
            <div className="p-6 border-b border-[var(--border-color)]/30 bg-[var(--bg-main)]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[var(--theme-purple)]" />
                        {label}
                    </h2>
                    <p className="text-sm text-[var(--text-subtle)] mt-1">{description}</p>
                </div>
                <button
                    onClick={() => onSave(pageKey)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-xl)] font-bold transition shadow-lg ${
                        saveStatus === 'success'
                        ? 'bg-green-500 text-white shadow-green-500/20'
                        : saveStatus === 'error'
                        ? 'bg-red-500 text-white shadow-red-500/20'
                        : 'bg-[var(--theme-purple)] text-white shadow-[var(--theme-purple)]/20 hover:opacity-90'
                    } disabled:opacity-50 active:scale-95`}
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saveStatus === 'success' ? (
                        <Check className="h-4 w-4" />
                    ) : saveStatus === 'error' ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Opslaan...' : saveStatus === 'success' ? 'Opgeslagen!' : 'Opslaan'}
                </button>
            </div>

            <div className="p-6">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Geselecteerde Groepen</p>

                <div className="flex flex-wrap gap-2 mb-8 min-h-[40px]">
                    {currentTokens.length === 0 ? (
                        <p className="text-sm text-[var(--text-light)] italic px-1">Geen groepen geselecteerd. Standaard code-permissies worden gebruikt.</p>
                    ) : (
                        currentTokens.map(token => (
                            <span key={token} className="flex items-center gap-1.5 px-3 py-1 bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] rounded-full text-xs font-bold ring-1 ring-[var(--theme-purple)]/20 animate-in zoom-in-95">
                                {token}
                                <button 
                                    onClick={() => onToggleToken(pageKey, token)} 
                                    className="hover:text-[var(--text-main)] transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))
                    )}
                </div>

                <div className="border-t border-[var(--border-color)]/30 pt-6">
                    <GroupSelector 
                        pageKey={pageKey}
                        selectedTokens={currentTokens}
                        allCommittees={allCommittees}
                        showAllGroups={showAllGroups}
                        onToggleToken={onToggleToken}
                    />
                </div>
            </div>
        </div>
    );
}
