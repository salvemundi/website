import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import PageHeader from '@/components/ui/layout/PageHeader';
import VerenigingManagementIsland from '@/components/islands/admin/VerenigingManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCommittees } from '@/server/actions/admin-committees.actions';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Vereniging Beheer | SV Salve Mundi',
};

export default async function BeheerVerenigingPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    const committees = await getCommittees().catch(() => []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 pt-8">
                <a 
                    href="/beheer" 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-primary hover:text-primary transition-all group"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Terug naar Beheer
                </a>
            </div>
            <VerenigingManagementIsland initialCommittees={committees} />
        </div>
    );
}
