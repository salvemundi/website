import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getActivityById, checkUserSignupStatus } from '@/server/actions/activiteit-actions';
import ActivityDetailIsland from '@/components/islands/activities/ActivityDetailIsland';
import EventSignupIsland from '@/components/islands/activities/EventSignupIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; token?: string }>;
}

export default async function PageActivityId({ params, searchParams }: PageProps) {
    const { id: rawId } = await params;
    const sParams = await searchParams;

    // Extract real ID from slug (e.g., "841-website-launch" -> "841")
    const id = rawId.split('-')[0];

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
    let verifiedPaymentStatus: 'paid' | 'open' | 'failed' | 'canceled' | null = null;
    let qrToken: string | undefined = undefined;
    let isSignedUp = false;

    if (user?.email) {
        const signupStatus = await checkUserSignupStatus(Number(activity.id), user.email);
        if (signupStatus.isSignedUp) {
            isSignedUp = true;
            qrToken = signupStatus.qrToken;
            verifiedPaymentStatus = signupStatus.paymentStatus as any;
        }
    }

    if (sParams.status === 'paid' && sParams.token) {
        verifiedPaymentStatus = 'paid';
        qrToken = sParams.token;
        isSignedUp = true;
    }

    return (
        <PublicPageShell>
            <div className="container mx-auto px-4 max-w-7xl pt-8 pb-4">
                <Link 
                    href="/activiteiten" 
                    className="inline-flex items-center gap-2 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all active:scale-95 shadow-sm"
                    title="Terug naar activiteiten"
                >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="text-sm font-bold pr-1">Terug</span>
                </Link>
            </div>

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
                    initialIsSignedUp={isSignedUp}
                />
            </ActivityDetailIsland>
        </PublicPageShell>
    );
}
