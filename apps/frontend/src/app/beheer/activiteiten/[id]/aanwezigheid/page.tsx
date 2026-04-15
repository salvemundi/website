import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getActivityById, getActivitySignups } from '@/server/actions/activiteit-actions';
import AttendanceIsland from '@/components/islands/activities/AttendanceIsland';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import { ClipboardCheck } from 'lucide-react';

import { checkAdminAccess } from '@/server/actions/admin.actions';

export const metadata: Metadata = {
    title: 'Aanwezigheidsbeheer | SV Salve Mundi',
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AttendancePage({ params }: PageProps) {
    const { id } = await params;
    const { user } = await checkAdminAccess();

    // NUCLEAR SSR: Fetch all data at the top level
    const [activity, signups] = await Promise.all([
        getActivityById(id),
        getActivitySignups(id)
    ]);

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
                <AttendanceIsland 
                    eventId={id} 
                    eventName={activity.titel} 
                    initialSignups={signups} 
                />
            </div>
        </div>
    );
}


