import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/ui/layout/PageHeader';
import AuditLogIsland from '@/components/islands/admin/AuditLogIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { Loader2 } from 'lucide-react';

async function checkAuditAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return false;
    
    const user = session.user as any;
    const memberships = user.committees || [];
    return memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kas') || name.includes('kandi');
    });
}

export default async function AuditLoggingPage() {
    const hasAccess = await checkAuditAccess();

    if (!hasAccess) {
        redirect('/beheer');
    }

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="container mx-auto px-4 py-32">
                    <div className="flex flex-col items-center justify-center py-24 bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] animate-pulse">
                        <Loader2 className="h-12 w-12 text-[var(--beheer-text-muted)] animate-spin mb-4" />
                        <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-xs">Audit interface laden...</p>
                    </div>
                </div>
            }>
                <AuditLogIsland />
            </Suspense>
        </main>
    );
}
