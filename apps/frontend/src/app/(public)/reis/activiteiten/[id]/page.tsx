import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Legacy redirect for the old /reis/activiteiten/[id] route.
 * Redirects participants to the modern final payment (restbetaling) page.
 */
export default async function LegacyActiviteitenRedirect({ params }: PageProps) {
    const { id } = await params;
    
    if (!id) {
        redirect('/reis');
    }

    // Redirect to the new query-param based structure
    redirect(`/reis/betalen/restbetaling?id=${id}`);
}
