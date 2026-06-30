import { getEnrichedSession } from '@/server/auth/auth-utils';
import { notFound } from 'next/navigation';
import { getActivityBySlug, checkUserSignupStatus } from '@/server/actions/events/public-activiteit.actions';
import { getSignupStatus } from '@/server/actions/events/public-activiteit-status.actions';
import ActivityDetailIsland from '@/components/islands/activities/ActivityDetailIsland';
import EventSignupIsland from '@/components/islands/activities/EventSignupIsland';
import { type EventSignup } from '@salvemundi/validations/directus/schema';
import { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { type Metadata } from 'next';
import { connection } from 'next/server';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; token?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const activity = await getActivityBySlug(id);

    if (!activity) {
        return {
            title: 'Activiteit niet gevonden | Salve Mundi'
        };
    }

    const cleanMetaDescription = activity.short_description
        ? activity.short_description.replace(/\*\*/g, '').trim()
        : 'Bekijk deze activiteit en schrijf je in bij Salve Mundi.';

    return {
        title: `${activity.name} | Salve Mundi`,
        description: cleanMetaDescription
    };
}

export default async function PageActivityId({ params, searchParams }: PageProps) {
    await connection();
    return (
        <PublicPageShell>
            <ActivityContent params={params} searchParams={searchParams} />
        </PublicPageShell>
    );
}

async function ActivityContent({ params, searchParams }: PageProps) {
    const { id: rawId } = await params;
    const sParams = await searchParams;

    const [activity, session] = await Promise.all([
        getActivityBySlug(rawId),
        getEnrichedSession()
    ]);

    if (!activity) notFound();

    const isEventPast = new Date(activity.event_date) < new Date();
    const isDeadlinePassed = activity.registration_deadline
        ? new Date(activity.registration_deadline) < new Date()
        : false;

    const user = session?.user as MembershipUserData | undefined;
    const isMember = user?.membership_status === 'active';
    const price = isMember ? activity.price_members : activity.price_non_members;

    let verifiedPaymentStatus: 'paid' | 'open' | 'failed' | 'canceled' | null = null;
    let qrToken: string | undefined = undefined;
    let isSignedUp = false;

    let signupId: number | undefined = undefined;
    if (user?.email) {
        const signupStatus = await checkUserSignupStatus(Number(activity.id), user.email, user.id);
        if (signupStatus.isSignedUp) {
            isSignedUp = true;
            qrToken = signupStatus.qrToken;
            verifiedPaymentStatus = signupStatus.paymentStatus as 'paid' | 'open' | 'failed' | 'canceled' | null;
            signupId = signupStatus.id;
        }
    }

    if (sParams.token) {
        const statusRes = await getSignupStatus(undefined, sParams.token);
        if (statusRes.status === 'paid') {
            verifiedPaymentStatus = 'paid';
            qrToken = (statusRes.signup as EventSignup).qr_token || sParams.token;
            isSignedUp = true;
        }
    }

    return (
        <>
            <div className="container px-4 max-w-7xl pt-8 pb-4">
                <BackButton href="/activiteiten" title="Terug naar activiteiten" />
            </div>

            <ActivityDetailIsland activity={activity} isLoggedIn={!!session?.user}>
                <EventSignupIsland
                    eventId={Number(activity.id)}
                    price={Number(price)}
                    eventDate={activity.event_date}
                    description={activity.description || ''}
                    eventName={activity.name}
                    initialUser={session?.user || null}
                    verifiedPaymentStatus={verifiedPaymentStatus}
                    initialQrToken={qrToken}
                    initialIsSignedUp={isSignedUp}
                    id={signupId}
                    isPast={isEventPast}
                    isDeadlinePassed={isDeadlinePassed}
                    isMembersOnly={!!activity.only_members}
                    isMember={isMember}
                />
            </ActivityDetailIsland>
        </>
    );
}