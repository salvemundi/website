'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import NoAccessPage from '@/app/admin/no-access/page';
import { isUserInIct, isUserAuthorized, getMergedTokens } from '@/shared/lib/committee-utils';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { siteSettingsApi, siteSettingsMutations } from '@/shared/lib/api/site-settings';
import { useSalvemundiCommittees } from '@/shared/lib/hooks/useSalvemundiApi';
import { Shield, Save, Loader2, Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface PermissionEntry {
    id: string;
    label: string;
    description: string;
    pageKey: string;
    currentTokens: string[];
}

const PERMISSION_PAGES: Omit<PermissionEntry, 'currentTokens'>[] = [
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

export default function PermissionsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { data: committees } = useSalvemundiCommittees();

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [settings, setSettings] = useState<Record<string, string[]>>({});
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({});
    const [showAllGroups, setShowAllGroups] = useState(false);

    // Authorization: ICT and Bestuur by default, or manageable via admin_permissions
    useEffect(() => {
        if (authLoading) return;

        const checkAccess = async () => {
            try {
                const setting = await siteSettingsApi.getSingle('admin_coupons', true);
                const tokens = getMergedTokens(setting?.authorized_tokens, ['ictcommissie', 'bestuur', 'kascommissie', 'kandidaatbestuur']);
                setIsAuthorized(isUserAuthorized(user, tokens));
            } catch (error) {
                setIsAuthorized(isUserInIct(user));
            }
        };

        checkAccess();
    }, [user, authLoading]);

    useEffect(() => {
        if (isAuthorized) {
            loadAllSettings();
        }
    }, [isAuthorized]);

    const loadAllSettings = async () => {
        setIsLoadingSettings(true);
        const newSettings: Record<string, string[]> = {};

        try {
            await Promise.all(PERMISSION_PAGES.map(async (page) => {
                const setting = await siteSettingsApi.getSingle(page.pageKey, true);
                const rawTokensField = setting?.authorized_tokens;
                let rawTokens: string[] = [];

                if (typeof rawTokensField === 'string') {
                    rawTokens = rawTokensField.split(',');
                }

                const cleanTokens = rawTokens
                    .map(t => t.trim().toLowerCase())
                    .filter(Boolean);

                newSettings[page.pageKey] = Array.from(new Set(cleanTokens));
            }));
            setSettings(newSettings);
        } catch (error) {
            console.error('Failed to load permission settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const handleToggleToken = (pageKey: string, rawToken: string) => {
        const token = rawToken.toLowerCase().trim();
        setSettings(prev => {
            const current = prev[pageKey] || [];
            if (current.includes(token)) {
                return { ...prev, [pageKey]: current.filter(t => t !== token) };
            } else {
                // Keep it unique
                const next = Array.from(new Set([...current, token]));
                return { ...prev, [pageKey]: next };
            }
        });
        // Clear status when changing
        setSaveStatus(prev => ({ ...prev, [pageKey]: null }));
    };

    const saveSettings = async (pageKey: string) => {
        setIsSaving(pageKey);
        setSaveStatus(prev => ({ ...prev, [pageKey]: null }));

        try {
            const tokens = settings[pageKey] || [];
            await siteSettingsMutations.upsertByPage(pageKey, {
                authorized_tokens: tokens.join(',')
            });
            setSaveStatus(prev => ({ ...prev, [pageKey]: 'success' }));

            // Auto-clear success message after 3 seconds
            setTimeout(() => {
                setSaveStatus(prev => ({ ...prev, [pageKey]: null }));
            }, 3000);
        } catch (error) {
            console.error(`Failed to save settings for ${pageKey}:`, error);
            setSaveStatus(prev => ({ ...prev, [pageKey]: 'error' }));
        } finally {
            setIsSaving(null);
        }
    };

    if (authLoading || isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            </div>
        );
    }

    if (!isAuthorized) {
        return <NoAccessPage />;
    }

    // Process committees to get unique tokens
    const uniqueCommittees = Array.from(
        (committees || []).reduce((acc, c) => {
            const token = c.name.toLowerCase().replace(/\|\|\s*salve mundi/gi, '').replace(/\|\s*salve mundi/gi, '').replace(/[^a-z0-9]/g, '').trim();
            const cleanName = c.name.replace(/\|\|\s*Salve Mundi/gi, '').replace(/\|\s*Salve Mundi/gi, '').trim();

            const entry = { ...c, name: cleanName, token };

            // If we already have this token, keep the one that is visible
            if (acc.has(token)) {
                if (c.is_visible !== false) {
                    acc.set(token, entry);
                }
            } else {
                acc.set(token, entry);
            }
            return acc;
        }, new Map<string, any>()).values()
    ).sort((a: any, b: any) => a.name.localeCompare(b.name)) as any[];

    const visibleGroups = uniqueCommittees.filter((c: any) => c.is_visible !== false);
    const hiddenGroups = uniqueCommittees.filter((c: any) => c.is_visible === false);

    return (
        <>
            <PageHeader
                title="Permissie Beheer"
                description="Beheer welke groepen toegang hebben tot beveiligde onderdelen van het admin paneel."
            />

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex-1">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 dark:bg-blue-900/20">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        <strong>Let op:</strong> Deze instellingen overschrijven de standaard permissies in de code.
                                        Zorg ervoor dat je altijd ten minste één groep (bijv. 'bestuur' of 'ict') toegang geeft.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAllGroups(!showAllGroups)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${showAllGroups
                            ? 'bg-purple-100 border-theme-purple text-theme-purple dark:bg-purple-900/40'
                            : 'bg-admin-card border-admin text-admin-muted hover:border-theme-purple/50'
                            }`}
                    >
                        {showAllGroups ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {showAllGroups ? 'Toon alleen zichtbare groepen' : `Toon ook verborgen groepen (${hiddenGroups.length})`}
                    </button>
                </div>

                {isLoadingSettings ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-theme-purple mb-4" />
                        <p className="text-admin-muted">Permissies laden...</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {PERMISSION_PAGES.map((page) => (
                            <div key={page.id} className="bg-admin-card rounded-xl shadow-sm border border-admin overflow-hidden">
                                <div className="p-6 border-b border-admin bg-admin-card-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-admin flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-theme-purple" />
                                            {page.label}
                                        </h2>
                                        <p className="text-sm text-admin-muted mt-1">{page.description}</p>
                                    </div>
                                    <button
                                        onClick={() => saveSettings(page.pageKey)}
                                        disabled={isSaving === page.pageKey}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition shadow-sm ${saveStatus[page.pageKey] === 'success'
                                            ? 'bg-green-500 text-white'
                                            : saveStatus[page.pageKey] === 'error'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-theme-purple text-white hover:bg-theme-purple-dark'
                                            } disabled:opacity-50`}
                                    >
                                        {isSaving === page.pageKey ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : saveStatus[page.pageKey] === 'success' ? (
                                            <Check className="h-4 w-4" />
                                        ) : saveStatus[page.pageKey] === 'error' ? (
                                            <X className="h-4 w-4" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        {isSaving === page.pageKey ? 'Opslaan...' : saveStatus[page.pageKey] === 'success' ? 'Opgeslagen!' : 'Opslaan'}
                                    </button>
                                </div>

                                <div className="p-6">
                                    <p className="text-xs font-bold text-admin-muted uppercase tracking-wider mb-4">Geselecteerde Groepen</p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {(!settings[page.pageKey] || settings[page.pageKey].length === 0) ? (
                                            <p className="text-sm text-admin-muted italic">Geen groepen geselecteerd. Standaard code-permissies worden gebruikt.</p>
                                        ) : (
                                            Array.from(new Set(settings[page.pageKey])).map(token => (
                                                <span key={token} className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full text-sm font-medium">
                                                    {token}
                                                    <button onClick={() => handleToggleToken(page.pageKey, token)} className="hover:text-purple-900 dark:hover:text-white">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>

                                    <div className="border-t border-admin pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">Beschikbare Groepen</p>
                                            {!showAllGroups && hiddenGroups.length > 0 && (
                                                <p className="text-[10px] text-admin-muted">
                                                    (+ {hiddenGroups.length} verborgen groepen)
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {/* Processed unique committee groups */}
                                            {(showAllGroups ? uniqueCommittees : visibleGroups).map(c => {
                                                const isSelected = (settings[page.pageKey] || []).includes(c.token);
                                                const isHidden = c.is_visible === false;

                                                return (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => handleToggleToken(page.pageKey, c.token)}
                                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${isSelected
                                                            ? 'bg-purple-50 border-theme-purple text-theme-purple dark:bg-purple-900/20'
                                                            : isHidden
                                                                ? 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 dark:bg-slate-800/20 dark:border-slate-700'
                                                                : 'bg-admin-card border-admin text-admin hover:border-theme-purple/50'
                                                            }`}
                                                    >
                                                        <span className="truncate mr-1" title={c.name}>{c.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            {isHidden && <EyeOff className="h-2.5 w-2.5 opacity-50" />}
                                                            {isSelected && <Check className="h-3 w-3" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-12 text-center">
                    <button
                        onClick={() => router.push('/admin')}
                        className="text-admin-muted hover:text-admin text-sm flex items-center gap-2 mx-auto"
                    >
                        Terug naar Dashboard
                    </button>
                </div>
            </div>
        </>
    );
}
