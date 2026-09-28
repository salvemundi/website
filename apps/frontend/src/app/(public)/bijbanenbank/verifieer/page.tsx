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
        <div className="min-h-dvh w-full pt-8">
            <div className="mx-auto max-w-xl px-4 py-12">
                {result.success ? (
                    <StandardFormCard title="E-mailadres geverifieerd" icon={<CheckCircle2 className="text-theme-success size-8" />}>
                        <p className="leading-relaxed text-(--text-main)">
                            Bedankt! Je e-mailadres is geverifieerd en je vacature staat nu klaar voor beoordeling
                            door onze commissie. Zodra deze is goedgekeurd, verschijnt hij op de website en
                            ontvang je hiervan een bevestiging per e-mail.
                        </p>
                        <Link href="/" className="mt-6 form-button inline-block">
                            Terug naar de homepage
                        </Link>
                    </StandardFormCard>
                ) : (
                    <StandardFormCard title="Verificatie mislukt" icon={<XCircle className="text-theme-error size-8" />}>
                        <p className="leading-relaxed text-(--text-main)">
                            {result.error || 'Deze verificatielink is ongeldig.'}
                        </p>
                        <Link href="/bijbanenbank/plaatsen" className="mt-6 form-button inline-block">
                            Opnieuw aanmelden
                        </Link>
                    </StandardFormCard>
                )}
            </div>
        </div>
    );
}
