import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import CommitteesList from '@/components/ui/committees/CommitteesList';

export const metadata: Metadata = {
    title: 'Commissies | SV Salve Mundi',
    description: 'Ontdek onze commissies en het team dat SV Salve Mundi draaiende houdt.' };

import { getCommittees } from '@/server/actions/public/committees.actions';

import { connection } from 'next/server';

export default async function CommissiesPage() {
    await connection();
    const committees = await getCommittees();

    return (
        <PublicPageShell>
            <div className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16">
                <div className="flex flex-col items-center mb-12 text-center">
                    <h1 className="text-4xl font-black text-text-main mb-4 tracking-tight uppercase">
                        Onze Commissies
                    </h1>
                    <p className="text-text-muted max-w-2xl text-lg font-medium leading-relaxed">
                        Ontdek onze commissies en het team dat SV Salve Mundi draaiende houdt.
                    </p>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full mt-6" />
                </div>
                <CommitteesList initialCommittees={committees} />
            </div>
        </PublicPageShell>
    );
}
