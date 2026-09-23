import type { Metadata } from 'next';
import BackButton from '@/components/ui/navigation/BackButton';
import NdaSignIsland from '@/components/islands/nda/NdaSignIsland';
import { getMyNdaToSign } from '@/server/actions/nda/member-nda.actions';

export const metadata: Metadata = {
    title: 'NDA Ondertekenen | SV Salve Mundi'
};

export default async function SignNdaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const nda = await getMyNdaToSign(Number(id));

    return (
        <div>
            <header className="bg-(--bg-soft) py-12">
                <div className="max-w-app mx-auto space-y-4 px-4">
                    <BackButton href="/profiel/nda" text="Terug naar mijn NDA's" />
                    <h1 className="text-4xl font-extrabold text-(--text-main)">NDA Ondertekenen</h1>
                </div>
            </header>

            <div className="max-w-app mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                {'error' in nda ? (
                    <div className="rounded-3xl border border-purple-100 bg-(--bg-card) p-8 text-center shadow-lg">
                        <p className="text-(--text-muted)">{nda.error}</p>
                    </div>
                ) : (
                    <NdaSignIsland signatureId={nda.signatureId} committeeName={nda.committeeName} documentFileId={nda.documentFileId} />
                )}
            </div>
        </div>
    );
}
