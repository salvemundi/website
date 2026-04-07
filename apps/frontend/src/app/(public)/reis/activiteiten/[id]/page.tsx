import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Omleidingspagina voor verouderde reis-activiteit URL's.
 * Stuurt deelnemers door naar de nieuwe betalingsstructuur.
 */
export default async function ReisActiviteitRedirect({ params }: PageProps) {
    const { id } = await params;
    
    if (!id) {
        redirect('/reis');
    }

    // Redirect to the new query-param based structure
    redirect(`/reis/betalen/restbetaling?id=${id}`);
}
