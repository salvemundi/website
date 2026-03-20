'use client';

import { useState, useTransition } from 'react';
import { 
    Shield, 
    AlertCircle, 
    Eye, 
    EyeOff, 
    Loader2, 
    ChevronLeft 
} from 'lucide-react';
import Link from 'next/link';
import { savePermission } from '@/server/actions/admin-permissions.actions';
import PermissionCard from '@/components/admin/permissions/PermissionCard';

interface PermissionsManagementIslandProps {
    initialPermissions: Record<string, string[]>;
    allCommittees: any[];
}

const PERMISSION_PAGES = [
    {
        id: 'intro',
        label: 'Introductie Beheer',
        description: 'Wie mag de introductie aanmeldingen en instellingen beheren?',
        pageKey: 'admin_intro'
    },
    {
        id: 'reis',
        label: 'Reis Beheer',
        description: 'Wie mag de reis aanmeldingen en instellingen beheren?',
        pageKey: 'admin_reis'
    },
    {
        id: 'logging',
        label: 'Systeem Logging',
        description: 'Wie mag de systeemlogs en foutmeldingen inzien?',
        pageKey: 'admin_logging'
    },
    {
        id: 'sync',
        label: 'Synchronisatie',
        description: 'Wie mag de koppeling met Microsoft Entra ID (sync) beheren?',
        pageKey: 'admin_sync'
    },
    {
        id: 'coupons',
        label: 'Coupons Beheer',
        description: 'Wie mag de coupons en kortingscodes beheren?',
        pageKey: 'admin_coupons'
    },
    {
        id: 'permissions',
        label: 'Permissies Beheer',
        description: 'Wie mag de toegangsrechten van het admin paneel beheren?',
        pageKey: 'admin_permissions'
    }
];

export default function PermissionsManagementIsland({ 
    initialPermissions, 
    allCommittees 
}: PermissionsManagementIslandProps) {
    const [permissions, setPermissions] = useState(initialPermissions);
    const [showAllGroups, setShowAllGroups] = useState(false);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({});
    const [isPending, startTransition] = useTransition();

    const handleToggleToken = (pageKey: string, token: string) => {
        setPermissions(prev => {
            const current = prev[pageKey] || [];
            if (current.includes(token)) {
                return { ...prev, [pageKey]: current.filter(t => t !== token) };
            } else {
                return { ...prev, [pageKey]: [...current, token] };
            }
        });
        setSaveStatus(prev => ({ ...prev, [pageKey]: null }));
    };

    const handleSave = async (pageKey: string) => {
        setIsSaving(pageKey);
        try {
            const tokens = permissions[pageKey] || [];
            await savePermission(pageKey, tokens);
            setSaveStatus(prev => ({ ...prev, [pageKey]: 'success' }));
            setTimeout(() => setSaveStatus(prev => ({ ...prev, [pageKey]: null })), 3000);
        } catch (err) {
            console.error(err);
            setSaveStatus(prev => ({ ...prev, [pageKey]: 'error' }));
        } finally {
            setIsSaving(null);
        }
    };

    const hiddenGroupsCount = allCommittees.filter(c => !c.is_visible).length;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
            {/* Header / Info Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-[var(--bg-card)]/40 p-6 rounded-[var(--radius-2xl)] ring-1 ring-[var(--border-color)]/30 backdrop-blur-sm">
                <div className="flex-1">
                    <div className="flex items-start gap-4 text-blue-500">
                        <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-[var(--text-main)] mb-1 uppercase tracking-tight">Belangrijke Instructie</p>
                            <p className="text-sm text-[var(--text-subtle)] leading-relaxed">
                                Deze instellingen overschrijven de standaard permissies in de code.
                                Zorg ervoor dat je altijd ten minste één groep (bijv. <span className="text-[var(--theme-purple)] font-bold">Bestuur</span> of <span className="text-[var(--theme-purple)] font-bold">ICT</span>) toegang geeft.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0">
                    <button
                        onClick={() => setShowAllGroups(!showAllGroups)}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-[var(--radius-xl)] border-2 font-bold transition-all ${
                            showAllGroups
                            ? 'bg-[var(--theme-purple)]/10 border-[var(--theme-purple)] text-[var(--theme-purple)] shadow-[var(--shadow-glow)]'
                            : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-light)] hover:border-[var(--theme-purple)]/30'
                        }`}
                    >
                        {showAllGroups ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        <span className="text-xs uppercase tracking-widest">
                            {showAllGroups ? 'Zichtbare groepen' : `Alle groepen (${hiddenGroupsCount})`}
                        </span>
                    </button>
                </div>
            </div>

            {/* Permissions Grid */}
            <div className="grid gap-8">
                {PERMISSION_PAGES.map((page) => (
                    <PermissionCard 
                        key={page.id}
                        {...page}
                        currentTokens={permissions[page.pageKey] || []}
                        allCommittees={allCommittees}
                        showAllGroups={showAllGroups}
                        isSaving={isSaving === page.pageKey}
                        saveStatus={saveStatus[page.pageKey] || null}
                        onToggleToken={handleToggleToken}
                        onSave={handleSave}
                    />
                ))}
            </div>

            {/* Footer Navigation */}
            <div className="mt-16 text-center">
                <Link 
                    href="/beheer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-light)] hover:text-[var(--theme-purple)] transition-all group"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Terug naar Dashboard
                </Link>
            </div>
        </div>
    );
}
