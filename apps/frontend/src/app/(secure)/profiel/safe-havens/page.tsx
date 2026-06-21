import type { Metadata } from 'next';
import BackButton from '@/components/ui/navigation/BackButton';

export const metadata: Metadata = {
    title: 'Safe Haven | SV Salve Mundi',
    description: 'Safe Haven Beschikbaarheid' };

export default function SafeHavenPage() {
    return (
        <div>
            <header className="bg-(--bg-soft) py-12">
                <div className="mx-auto max-w-app px-4 space-y-4">
                    <BackButton href="/profiel" text="Terug naar profiel" />
                    <h1 className="text-4xl font-extrabold text-(--text-main)">Safe Haven Beschikbaarheid</h1>
                </div>
            </header>
            
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-(--bg-card) border border-purple-100 p-8 text-center shadow-lg">
                    <h2 className="text-xl font-bold text-(--text-main)">Bewerken van beschikbaarheid uitgeschakeld</h2>
                    <p className="mt-4 text-(--text-muted) max-w-2xl mx-auto">
                        Het bijwerken van Safe Haven beschikbaarheid is momenteel uitgeschakeld. Neem contact op met het bestuur
                        als je deze functionaliteit nodig hebt.
                    </p>
                </div>
            </div>
        </div>
    );
}
