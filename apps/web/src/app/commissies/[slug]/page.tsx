import { getCommitteesWithMembers, getCommittee, getEventsByCommittee } from '@/shared/api/salvemundi-server';
import { slugify } from '@/shared/lib/utils/slug';

import CommitteeClient from './CommitteeClient';
import { notFound } from 'next/navigation';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

export default async function CommitteeDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const slug = params.slug;

    // Fetch all committees to find the ID by slug
    // Note: getCommitteesWithMembers is cached, so this is efficient
    const committeesData = await getCommitteesWithMembers();

    // Find committee by slug
    const committeeSummary = committeesData.find(
        (c) => slugify(cleanCommitteeName(c.name)) === slug
    );

    if (!committeeSummary) {
        notFound();
    }

    const committeeId = committeeSummary.id;

    // Fetch full committee details and events on the server
    const [committee, events] = await Promise.all([
        getCommittee(committeeId),
        getEventsByCommittee(committeeId)
    ]);

    if (!committee) {
        notFound();
    }

    const cleanName = cleanCommitteeName(committee.name);

    return (
        <CommitteeClient
            committee={committee}
            committeeDetail={committee} // In server version, committee already has full details
            events={events}
            committeeId={committeeId}
            cleanName={cleanName}
        />
    );
}

export async function generateStaticParams() {
    const committees = await getCommitteesWithMembers();
    const committeeList = Array.isArray(committees) ? committees : [];
    return committeeList.map((c) => ({
        slug: slugify(cleanCommitteeName(c.name)),
    }));
}
