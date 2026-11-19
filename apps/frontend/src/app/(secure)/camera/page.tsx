import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getCameraPageData } from '@/server/actions/public/camera.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { CameraRequestIsland } from '@/components/islands/camera/CameraRequestIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Camera aanvragen | SV Salve Mundi',
    description: 'Vraag de verenigingscamera en eventueel een fotograaf aan voor een activiteit.',
};

export default async function CameraPage() {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }
    if (session.user.membership_status !== 'active') {
        redirect('/profiel');
    }

    const { events, committees, myCommitteeIds, photographers, mine } = await getCameraPageData();

    return (
        <PublicPageShell title="Camera aanvragen">
            <div className="container mx-auto max-w-7xl px-4 pt-8">
                <BackButton href="/profiel" />
            </div>
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <CameraRequestIsland
                    events={events}
                    committees={committees}
                    myCommitteeIds={myCommitteeIds}
                    photographers={photographers}
                    mine={mine}
                />
            </div>
        </PublicPageShell>
    );
}
