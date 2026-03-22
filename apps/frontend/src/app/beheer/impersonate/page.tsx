import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import ImpersonateIsland from '@/components/islands/admin/ImpersonateIsland';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Test Modus | Salve Mundi Beheer',
};

export default async function ImpersonatePage() {
    // 1. Controleer permissies op de server
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) {
        redirect('/beheer');
    }

    // 2. Halen we impersonatie gegevens op (gebeurt nu centraal in checkAdminAccess)
    const { impersonation } = await checkAdminAccess();
    const cookieStore = await cookies();
    const activeToken = cookieStore.get('directus_test_token')?.value || null;

    return (
        <main className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-8">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/beheer"
                    className="mb-8 inline-flex items-center gap-2 text-theme-purple-lighter/60 hover:text-theme-purple transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Terug naar Dashboard
                </Link>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end shadow-2xl border border-white/5">
                    {/* Decorative Blurs */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-theme-purple/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-blue-500/5 blur-3xl" />

                    <div className="relative p-8">
                        <header className="mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="rounded-2xl bg-theme-purple/20 p-3 text-theme-purple-lighter">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Test Modus</h1>
                                    <p className="text-theme-purple-lighter/60">Imiteer een andere gebruiker via Directus</p>
                                </div>
                            </div>
                        </header>
 
                        {/* Interactief Island */}
                        <ImpersonateIsland 
                            activeToken={activeToken} 
                            impersonatedName={impersonation?.name || null}
                            impersonatedCommittees={impersonation?.committees || []}
                        />

                        {/* Instructies (Server Rendered) */}
                        <div className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/5">
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-theme-purple" />
                                Hoe werkt het?
                            </h3>
                            <ul className="text-sm text-theme-purple-lighter/60 space-y-2">
                                <li className="flex gap-2"><span className="text-theme-purple font-bold">•</span> Ga naar Directus &gt; User Settings &gt; Token.</li>
                                <li className="flex gap-2"><span className="text-theme-purple font-bold">•</span> Kopieer de statische token van de user die je wilt testen.</li>
                                <li className="flex gap-2"><span className="text-theme-purple font-bold">•</span> Plak deze hierboven en klik op 'Start Testen'.</li>
                                <li className="flex gap-2 text-orange-400/80"><span className="text-orange-400 font-bold">•</span> Let op: Dit overschrijft tijdelijk je eigen rechten in de datalaag.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}