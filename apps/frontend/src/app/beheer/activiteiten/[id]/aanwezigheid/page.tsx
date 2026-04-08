import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getActivityById } from '@/server/actions/activiteit-actions';
import AttendanceIsland from '@/components/islands/activities/AttendanceIsland';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import { ClipboardCheck, Loader2 } from 'lucide-react';

import { checkAdminAccess } from '@/server/actions/admin.actions';

export const metadata: Metadata = {
    title: 'Aanwezigheidsbeheer | SV Salve Mundi',
};

interface PageProps {
    params: Promise<{ id: string }>;
}

async function AttendanceData({ id }: { id: string }) {
    const activity = await getActivityById(id);
    if (!activity) return notFound();

    return (
        <div className="w-full">
            <AnimatedBeheerHeader 
                title="Aanwezigheid"
                subtitle={`Beheer de aanwezigheid voor "${activity.titel}".`}
                backLink={`/beheer/activiteiten/${id}/aanmeldingen`}
                icon={<ClipboardCheck className="h-10 w-10" />}
            />
            <div className="max-w-7xl mx-auto px-4 pb-24">
                <AttendanceIsland eventId={id} eventName={activity.titel} />
            </div>
        </div>
    );
}

export default async function AttendancePage({ params }: PageProps) {
    const { id } = await params;
    const { user } = await checkAdminAccess();

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[var(--beheer-accent)]" />
                    <span className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-sm">Aanwezigheid laden...</span>
                </div>
            }>
                <AttendanceData id={id} />
            </Suspense>
        </main>
    );
}

