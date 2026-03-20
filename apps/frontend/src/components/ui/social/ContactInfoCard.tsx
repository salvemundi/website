import Link from 'next/link';
import { Suspense } from 'react';
import { getDocumenten } from '@/server/actions/website.actions';
import DocumentenLijst from '@/components/ui/social/DocumentenLijst';
import SafeHavenButton from '@/components/islands/social/SafeHavenButton';
import WhatsAppLink from '@/components/islands/social/WhatsAppLink';

/**
 * Skeleton voor de documentenlijst om layout shift (CLS) te voorkomen.
 * Mimickt de uiteindelijke lijstweergave.
 */
function DocumentenSkeleton() {
    return (
        <div className="space-y-3 ml-14 animate-pulse">
            {[1, 2].map((i) => (
                <div key={i} className="h-5 bg-[var(--bg-soft)] rounded-md w-3/4" />
            ))}
        </div>
    );
}

/**
 * Server Component die specifiek de documenten ophaalt.
 * Wordt asynchroon ingeladen via Suspense.
 */
async function ContactDocumenten() {
    const documenten = await getDocumenten();

    return <DocumentenLijst documenten={documenten} />;
}

/**
 * Statische kaart met verenigingsinformatie, adres, KvK en documenten.
 * De documentenlijst is asynchroon (Suspense) voor optimale Performance.
 */
function InformatieKaart() {
    return (
        <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-[var(--text-main)] mb-6">
                Informatie
            </h2>

            <div className="space-y-6">
                {/* Adres */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-purple-100)] flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl" aria-hidden="true">📍</span>
                    </div>
                    <div>
                        <p className="text-[var(--text-main)] text-[1.3rem] font-bold">
                            Rachelsmolen 1
                        </p>
                        <p className="text-[var(--text-muted)] text-[var(--font-size-sm)] mt-1">
                            Gebouw R10
                        </p>
                        <p className="text-[var(--text-muted)] text-[var(--font-size-sm)] mt-1">
                            Lokaal 2.26 (2de verdieping)
                        </p>
                    </div>
                </div>

                {/* KvK-nummer */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-purple-100)] flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl" aria-hidden="true">🏢</span>
                    </div>
                    <div>
                        <p className="text-[var(--text-main)] text-[1.3rem] font-bold">
                            KvK nr. 70280606
                        </p>
                    </div>
                </div>

                {/* Activiteitenkalender */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-purple-100)] flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl" aria-hidden="true">📅</span>
                    </div>
                    <div>
                        <Link
                            href="/activiteiten"
                            className="text-[var(--text-main)] text-[1.3rem] font-bold hover:opacity-80 transition-opacity"
                        >
                            Kalender
                        </Link>
                    </div>
                </div>

                {/* Documenten (statuten, avg, etc.) - Suspendable Boundary */}
                <div className="pt-6">
                    <h3 className="font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                        <span className="text-2xl" aria-hidden="true">📄</span>
                        Documenten
                    </h3>
                    <Suspense fallback={<DocumentenSkeleton />}>
                        <ContactDocumenten />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

/**
 * Kaart met contactgegevens (e-mail, telefoon, WhatsApp, Safe Havens).
 * WhatsApp en Safe Havens zijn client islands voor interactiviteit.
 */
function ContactKaart() {
    return (
        <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-[var(--text-main)] mb-6">
                Contact
            </h2>

            <div className="space-y-6">
                {/* E-mailadres */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-purple-100)] flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl" aria-hidden="true">✉️</span>
                    </div>
                    <div>
                        <a
                            href="mailto:info@salvemundi.nl"
                            className="text-[var(--text-main)] text-[1.3rem] font-bold hover:opacity-80 transition-opacity"
                        >
                            info@salvemundi.nl
                        </a>
                    </div>
                </div>

                {/* Telefoonnummer */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-purple-100)] flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl" aria-hidden="true">📞</span>
                    </div>
                    <div>
                        <a
                            href="tel:+31624827777"
                            className="text-[var(--text-main)] text-[1.3rem] font-bold hover:opacity-80 transition-opacity"
                        >
                            +31 6 24827777
                        </a>
                    </div>
                </div>

                {/* WhatsApp — alleen zichtbaar voor ingelogde leden (client island) */}
                <WhatsAppLink />

                {/* Safe Havens knop (client island — useRouter) */}
                <SafeHavenButton />
            </div>
        </div>
    );
}

/**
 * Hoofdcomponent: 2-koloms grid van Informatie- en Contactkaart.
 * Geëxporteerd voor gebruik in de contactpagina.
 */
export default function ContactInfoCard() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InformatieKaart />
            <ContactKaart />
        </div>
    );
}

