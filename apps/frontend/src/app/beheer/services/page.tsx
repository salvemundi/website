'use client';

import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import ServicesStatusIsland from '@/components/islands/admin/ServicesStatusIsland';
import { Loader2 } from 'lucide-react';

export default function ServicesStatusPage() {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)]">
            <Loader2 className="h-10 w-10 text-[var(--beheer-accent)] animate-spin mb-4" />
            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px]">Laden...</p>
        </div>
    );
    
    if (!session || !session.user) {
        redirect('/beheer');
    }
    
    const user = session.user as any;
    const memberships = user.committees || [];
    
    const hasAccess = memberships.some((c: any) => 
        c.id === COMMITTEES.ICT || c.id === COMMITTEES.BESTUUR
    );

    if (!hasAccess) {
        redirect('/beheer');
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-[var(--beheer-accent)] animate-spin mb-2" />
                        <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px]">Status ophalen...</p>
                    </div>
                }>
                    <ServicesStatusIsland />
                </Suspense>
            </div>
        </div>
    );
}
