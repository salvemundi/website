import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getActivityById } from '@/server/actions/activiteit-actions';
import AttendanceIsland from '@/components/islands/activities/AttendanceIsland';
import PageHeader from '@/components/ui/layout/PageHeader';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function AttendanceData({ id }: { id: string }) {
    const activity = await getActivityById(id);
    if (!activity) notFound();

    return (
        <div className="w-full space-y-8">
            <PageHeader 
                title="Aanwezigheidsbeheer"
                description={activity.titel}
                variant="centered"
                contentPadding="py-12"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
            />
            <div className="max-w-7xl mx-auto px-4 pb-20">
                <AttendanceIsland eventId={id} eventName={activity.titel} />
            </div>
        </div>
    );
}

export default async function AttendancePage({ params }: PageProps) {
    const { id } = await params;

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<div className="p-20 text-center animate-pulse text-[var(--theme-purple)] font-black">LADEN...</div>}>
                <AttendanceData id={id} />
            </Suspense>
        </main>
    );
}
