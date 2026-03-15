import React from 'react';
import { getCommitteeBySlug } from '@/server/actions/committees.actions';
import { notFound } from 'next/navigation';
import { CommitteeDetail } from '@/components/ui/committees/CommitteeDetail';

interface CommitteeDetailDisplayProps {
    slug: string;
}

export default async function CommitteeDetailDisplay({ slug }: CommitteeDetailDisplayProps) {
    const committee = await getCommitteeBySlug(slug);

    if (!committee) {
        notFound();
    }

    return <CommitteeDetail committee={committee} />;
}
