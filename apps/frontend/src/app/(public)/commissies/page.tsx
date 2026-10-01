import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import CommitteesList from '@/components/ui/commissies/CommitteesList';

export const metadata: Metadata = {
    title: 'Commissies | SV Salve Mundi',
    description: 'Ontdek onze commissies die SV Salve Mundi draaiende houden.'
};

import { getCommittees } from '@/server/actions/public/committees.actions';

import { connection } from 'next/server';

export default async function CommissiesPage() {
    await connection();
    const committees = await getCommittees();

    return (
        <PublicPageShell>
            <div className="max-w-app mx-auto px-4 py-8 sm:py-12 lg:py-16">
                <div className="mb-12 flex flex-col items-center text-center">
                    <h1 className="mb-4 text-4xl font-black tracking-tight text-purple-700 dark:text-purple-300">
                        Onze Commissies
                    </h1>
                    <p className="max-w-2xl text-lg leading-relaxed font-medium text-(--text-muted)">
                        Ontdek onze commissies die SV Salve Mundi draaiende houden.
                    </p>
                    <div className="mt-6 h-1 w-24 rounded-full bg-linear-to-r from-transparent via-purple-500 to-transparent" />
                </div>
                <CommitteesList initialCommittees={committees} />
            </div>
        </PublicPageShell>
    );
}
