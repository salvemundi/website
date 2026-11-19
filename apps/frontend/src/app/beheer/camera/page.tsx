import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import { getCameraLoansDb, getCameraPhotographersDb, getCameraRequestsDb } from '@/server/queries/camera/beheer-camera.queries';
import BeheerCameraIsland from '@/components/islands/beheer/camera/BeheerCameraIsland';
import { connection } from 'next/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Camera Beheer | Salve Mundi',
    description: 'Beoordeel cameraaanvragen, wijs fotografen toe en beheer de lijst met toegelaten fotografen.',
};

export default async function BeheerCameraPage() {
    await connection();
    const [requests, photographers, loans] = await Promise.all([
        getCameraRequestsDb(),
        getCameraPhotographersDb(),
        getCameraLoansDb(),
    ]);

    return (
        <BeheerPageShell title="Camera Beheer" backHref="/beheer">
            <BeheerCameraIsland requests={requests} photographers={photographers} loans={loans} />
        </BeheerPageShell>
    );
}
