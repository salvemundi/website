import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import NdaCommitteeDetailIsland from '@/components/islands/beheer/nda/NdaCommitteeDetailIsland';
import { getCommitteeNdaDetail } from '@/server/actions/beheer/nda/beheer-nda-templates.actions';
import { getNdaSettings } from '@/server/actions/beheer/nda/beheer-nda-settings.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';

export const metadata: Metadata = {
    title: 'NDA Commissie | SV Salve Mundi'
};

export default async function BeheerNdaCommitteePage({ params }: { params: Promise<{ committeeId: string }> }) {
    const { committeeId } = await params;
    const id = Number(committeeId);

    const [detail, settings, session] = await Promise.all([
        getCommitteeNdaDetail(id),
        getNdaSettings(),
        getEnrichedSession(),
    ]);

    if (!detail) {
        notFound();
    }

    const isSecretary = !!settings.secretaryUserId && settings.secretaryUserId === session?.user.id;

    return (
        <BeheerPageShell title={`NDA — ${detail.committee.name}`} backHref="/beheer/nda">
            <NdaCommitteeDetailIsland detail={detail} isSecretary={isSecretary} />
        </BeheerPageShell>
    );
}
