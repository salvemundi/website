import React from 'react';
import Link from 'next/link';
import { MapPin, Building, Calendar, Mail, Phone, FileText } from 'lucide-react';
import DocumentenLijst from '@/components/ui/social/DocumentenLijst';
import SafeHavenButton from '@/components/islands/social/SafeHavenButton';
import WhatsAppLink from '@/components/islands/social/WhatsAppLink';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import type { Document as WebsiteDocument } from '@salvemundi/validations/schema/website.zod';



/**
 * Statische kaart met verenigingsinformatie, adres, KvK en documenten.
 * De documentenlijst is asynchroon (Suspense) voor optimale Performance.
 */
function InformatieKaart({ documenten }: { documenten: WebsiteDocument[] }) {
    return (
        <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-[var(--text-main)] mb-6">
                Informatie
            </h2>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[var(--text-main)] text-xl font-bold leading-tight">
                            Rachelsmolen 1
                        </p>
                        <p className="text-[var(--text-muted)] text-base mt-0.5">
                            Gebouw R10, Lokaal 2.26
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Building className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[var(--text-main)] text-xl font-bold">
                            KvK nr. 70280606
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <Link
                            href="/activiteiten"
                            className="text-[var(--text-main)] text-xl font-bold hover:text-[var(--color-purple-500)] transition-colors"
                        >
                            Activiteitenkalender
                        </Link>
                    </div>
                </div>

                <div className="pt-6">
                    <h3 className="font-bold text-[var(--text-main)] text-lg mb-4 flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[var(--color-purple-500)]" />
                        Documenten
                    </h3>
                    <DocumentenLijst documenten={documenten} />
                </div>
            </div>
        </div>
    );
}

/**
 * Kaart met contactgegevens (e-mail, telefoon, WhatsApp, Safe Havens).
 * WhatsApp en Safe Havens zijn client islands voor interactiviteit.
 */
function ContactKaart({ isLoggedIn }: { isLoggedIn: boolean }) {
    return (
        <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-[var(--text-main)] mb-6">
                Contact
            </h2>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Mail className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-[var(--text-main)] text-xl font-bold">
                            <ObfuscatedEmail email="info@salvemundi.nl" showIcon={false} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Phone className="h-6 w-6" />
                    </div>
                    <div>
                        <a
                            href="tel:+31624827777"
                            className="text-[var(--text-main)] text-xl font-bold hover:text-[var(--color-purple-500)] transition-colors"
                        >
                            +31 6 24827777
                        </a>
                    </div>
                </div>

                {/* WhatsApp — alleen zichtbaar voor ingelogde leden (client island) */}
                <WhatsAppLink isLoggedIn={isLoggedIn} />

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
export default function ContactInfoCard({ documenten, isLoggedIn }: { documenten: WebsiteDocument[], isLoggedIn: boolean }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InformatieKaart documenten={documenten} />
            <ContactKaart isLoggedIn={isLoggedIn} />
        </div>
    );
}

