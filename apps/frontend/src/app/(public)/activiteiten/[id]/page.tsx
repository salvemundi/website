import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getActivityById } from '@/server/actions/activiteit-actions';
import ActivityDetailIsland from '@/components/islands/activities/ActivityDetailIsland';
import EventSignupIsland from '@/components/islands/activities/EventSignupIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; token?: string }>;
}

export default async function PageActivityId({ params, searchParams }: PageProps) {
    const { id } = await params;
    const sParams = await searchParams;

    // NUCLEAR SSR: Fetch activity, session and headers in parallel before flushing
    const [activity, session] = await Promise.all([
        getActivityById(id),
        auth.api.getSession({
            headers: await headers()
        })
    ]);

    if (!activity) notFound();

    const isPast = new Date(activity.datum_start) < new Date();
    
    // Server-side authoritative price determination
    const user = session?.user as any;
    const isMember = user?.membership_status === 'active';
    const price = isMember ? (activity.price_members ?? 0) : (activity.price_non_members ?? 0);

    // Server-side payment verification
    let verifiedPaymentStatus: 'paid' | null = null;
    let qrToken: string | undefined = undefined;

    if (sParams.status === 'paid' && sParams.token) {
        verifiedPaymentStatus = 'paid';
        qrToken = sParams.token;
    }

    return (
        <PublicPageShell>
            <ActivityDetailIsland activity={activity}>
                <EventSignupIsland 
                    eventId={Number(activity.id)}
                    price={price}
                    eventDate={activity.datum_start}
                    description={activity.beschrijving || ''}
                    isPast={isPast}
                    eventName={activity.titel}
                    initialUser={session?.user || null}
                    verifiedPaymentStatus={verifiedPaymentStatus}
                    initialQrToken={qrToken}
                />
            </ActivityDetailIsland>
        </PublicPageShell>
    );
}
