import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';
import { verifySubmission } from '@/server/actions/vacancies/vacancies-submission.actions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Vacature Verifiëren | SV Salve Mundi'
};

interface VerifyPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function VerifyVacancyPage({ searchParams }: VerifyPageProps) {
    const { token } = await searchParams;
    const result = token ? await verifySubmission(token) : { success: false, error: 'Geen verificatietoken opgegeven.' };

    return (
        <div className="w-full min-h-dvh pt-8">
            <div className="mx-auto max-w-xl px-4 py-12">
                {result.success ? (
                    <StandardFormCard title="E-mailadres geverifieerd" icon={<CheckCircle2 className="w-8 h-8 text-theme-success" />}>
                        <p className="text-(--text-main) leading-relaxed">
                            Bedankt! Je e-mailadres is geverifieerd en je vacature staat nu klaar voor beoordeling
                            door onze commissie. Zodra deze is goedgekeurd, verschijnt hij op de website en
                            ontvang je hiervan een bevestiging per e-mail.
                        </p>
                        <Link href="/" className="form-button inline-block mt-6 text-theme-purple font-bold hover:underline">
                            Terug naar de homepage
                        </Link>
                    </StandardFormCard>
                ) : (
                    <StandardFormCard title="Verificatie mislukt" icon={<XCircle className="w-8 h-8 text-theme-error" />}>
                        <p className="text-(--text-main) leading-relaxed">
                            {result.error || 'Deze verificatielink is ongeldig.'}
                        </p>
                        <Link href="/bijbanenbank/plaatsen" className="form-button inline-block mt-6 text-theme-purple font-bold hover:underline">
                            Opnieuw aanmelden
                        </Link>
                    </StandardFormCard>
                )}
            </div>
        </div>
    );
}
