import type { Metadata } from 'next';
import Link from 'next/link';
import { FileSignature } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';
import { getMyNdas } from '@/server/actions/nda/member-nda.actions';

export const metadata: Metadata = {
    title: 'Mijn NDA\'s | SV Salve Mundi'
};

const statusLabel: Record<string, string> = {
    pending: 'Actie vereist: ondertekenen',
    signed: 'Getekend',
    expired: 'Verlopen',
    superseded: 'Vervangen',
};

export default async function MyNdasPage() {
    const ndas = await getMyNdas();

    return (
        <div>
            <header className="bg-(--bg-soft) py-12">
                <div className="max-w-app mx-auto space-y-4 px-4">
                    <BackButton href="/profiel" text="Terug naar profiel" />
                    <h1 className="text-4xl font-extrabold text-(--text-main)">Mijn NDA&apos;s</h1>
                </div>
            </header>

            <div className="max-w-app mx-auto space-y-4 px-4 py-8 sm:px-6 lg:px-8">
                {ndas.length === 0 && (
                    <p className="text-(--text-muted)">Je hebt nog geen NDA-uitnodigingen.</p>
                )}
                {ndas.map((nda) => (
                    <div key={nda.id} className="flex items-center justify-between gap-4 rounded-3xl border border-purple-100 bg-(--bg-card) p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--theme-purple)/10 text-(--theme-purple)">
                                <FileSignature className="size-5" />
                            </div>
                            <div>
                                <p className="font-bold text-(--text-main)">{nda.committeeName}</p>
                                <p className="text-sm text-(--text-muted)">{statusLabel[nda.status] ?? nda.status}</p>
                            </div>
                        </div>
                        {nda.status === 'pending' && (
                            <Link href={`/profiel/nda/${nda.id}`} className="form-button rounded-xl bg-(--theme-purple) px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
                                Ondertekenen
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
