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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <PageHeader
                title="Audit & Goedkeuring"
                description="Beheer inschrijvingen, logboek en handmatige goedkeuringsflow."
            />

            <div className="container mx-auto px-4 -mt-8 max-w-6xl relative z-10">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 animate-pulse">
                        <Loader2 className="h-12 w-12 text-slate-300 dark:text-slate-600 animate-spin mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-medium font-inter">Audit interface laden...</p>
                    </div>
                }>
                    <AuditLogIsland />
                </Suspense>
            </div>
        </div>
    );
}
