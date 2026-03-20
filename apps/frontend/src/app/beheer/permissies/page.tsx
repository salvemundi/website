import { Suspense } from 'react';
import { Shield } from 'lucide-react';
import { getPermissions, getAllCommittees } from '@/server/actions/admin-permissions.actions';
import PermissionsManagementIsland from '@/components/islands/admin/PermissionsManagementIsland';

export const metadata = {
    title: 'Permissies Beheer | Salve Mundi',
    description: 'Beheer de toegang tot het administratieve paneel.',
};

export default async function PermissiesPage() {
    // Fetch initial data on the server
    const [permissions, committees] = await Promise.all([
        getPermissions().catch(() => ({})),
        getAllCommittees().catch(() => [])
    ]);

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            {/* Page Header Area */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                <div className="container mx-auto px-4 py-12 max-w-5xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-[var(--radius-xl)] bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] flex items-center justify-center shadow-lg shadow-[var(--theme-purple)]/5">
                            <Shield className="h-7 w-7" />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">
                            Permissie <span className="text-[var(--theme-purple)]">Beheer</span>
                        </h1>
                    </div>
                    <p className="text-[var(--text-subtle)] text-lg max-w-2xl leading-relaxed">
                        Beheer welke werkgroepen en commissies toegang hebben tot beveiligde onderdelen van het admin paneel.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--theme-purple)]/20 border-t-[var(--theme-purple)] mb-4" />
                    <p className="text-[var(--text-light)] font-bold uppercase tracking-widest text-xs">Permissies laden...</p>
                </div>
            }>
                <PermissionsManagementIsland 
                    initialPermissions={permissions} 
                    allCommittees={committees} 
                />
            </Suspense>
        </main>
    );
}
