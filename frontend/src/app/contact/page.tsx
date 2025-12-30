'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/shared/lib/api/salvemundi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

interface Document {
    id: number;
    title: string;
    description?: string;
    file: string;
    category: string;
    display_order: number;
}

export default function ContactPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';

    const { data: documents, isLoading: documentsLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: documentsApi.getAll,
    });

    return (
        <div className="">
            <PageHeader
                title="CONTACT"
            >
                <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mt-4">
                    Neem contact met ons op voor vragen, suggesties of informatie
                </p>
            </PageHeader>
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Informatie Section */}
                        <div className="bg-white dark:bg-[#1f1921] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8">
                            <h2 className="text-3xl font-bold text-purple mb-6">
                                Informatie
                            </h2>

                            <div className="space-y-6">
                                {/* Address */}
                                <div className="flex items-start items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-theme-purple-light flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">📍</span>
                                    </div>
                                    <div>
                                        <p
                                            className="text-theme-purple text-[1.3rem] font-bold hover:text-theme-purple-dark transition-colors"
                                        >
                                            Rachelsmolen 1, 5612MA Eindhoven
                                        </p>
                                        <p className="text-theme-purple/70 text-sm mt-1">
                                            Gebouw R1 • Lokaal R1.31
                                        </p>
                                    </div>
                                </div>

                                {/* KvK */}
                                <div className="flex items-start items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-theme-purple-light flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">🏢</span>
                                    </div>
                                    <div>
                                        <p
                                            className="text-theme-purple text-[1.3rem] font-bold hover:text-theme-purple-dark transition-colors"
                                        >
                                            KvK nr. 70280606
                                        </p>
                                    </div>
                                </div>

                                {/* Kalender */}
                                <div className="flex items-start items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-theme-purple-light flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">📅</span>
                                    </div>
                                    <div>
                                        <a
                                            href="/activiteiten"
                                            className="text-theme-purple text-[1.3rem] font-bold hover:text-theme-purple-dark transition-colors"
                                        >
                                            Kalender
                                        </a>
                                    </div>
                                </div>

                                {/* Documents Section */}
                                <div className="pt-6">
                                    <h3 className="font-semibold text-theme-purple mb-4  flex items-center gap-2">
                                        <span className="text-2xl">📄</span>
                                        Documenten
                                    </h3>
                                    <div className="space-y-3 ml-14">
                                        {documentsLoading ? (
                                            <p className="text-theme-muted text-sm">Laden...</p>
                                        ) : documents && documents.length > 0 ? (
                                            documents.map((doc: Document) => {
                                                // Construct file download URL
                                                const fileUrl = `${directusUrl}/assets/${doc.file}`;

                                                return (
                                                    <a
                                                        key={doc.id}
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-theme-muted hover:text-theme-white transition-colors group"
                                                        title={doc.description || doc.title}
                                                    >
                                                        <span className="group-hover:translate-x-1 inline-block transition-transform">→</span> {doc.title}
                                                    </a>
                                                );
                                            })
                                        ) : (
                                            <p className="text-theme-muted text-sm">Geen documenten beschikbaar</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="bg-white dark:bg-[#1f1921] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8">
                            <h2 className="text-3xl font-bold text-purple mb-6">
                                Contact
                            </h2>

                            <div className="space-y-6">
                                {/* Email */}
                                <div className="flex items-start items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-theme-purple-light flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">✉️</span>
                                    </div>
                                    <div>
                                        <a
                                            href="mailto:info@salvemundi.nl"
                                            className="text-theme-purple text-[1.3rem] font-bold hover:text-theme-purple-dark transition-colors"
                                        >
                                            info@salvemundi.nl
                                        </a>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-theme-purple-light flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">📞</span>
                                    </div>
                                    <div>
                                        <a
                                            href="tel:+31624827777"
                                            className="text-theme-purple text-[1.3rem] font-bold hover:text-theme-purple-dark transition-colors"
                                        >
                                            +31 6 24827777
                                        </a>
                                    </div>
                                </div>

                                {/* WhatsApp (only for authenticated users) */}
                                {isAuthenticated && (
                                    <div className="flex items-start items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-theme-purple-light flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">💬</span>
                                        </div>
                                        <div>
                                            <a
                                                href="https://wa.me/31624827777"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-theme-purple text-[1.3rem] font-bold hover:text-theme-purple-dark transition-colors"
                                            >
                                                WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Safe Havens Button */}
                                <div className="pt-6">
                                    <button
                                        onClick={() => router.push('/safe-havens')}
                                        className="w-full bg-gradient-theme text-theme-white rounded-2xl p-6 font-semibold hover:-translate-y-0.5 transition-all shadow-lg shadow-theme-purple/30 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-2xl">️</span>
                                            </div>
                                            <div className="text-left">
                                                <div className="text-lg font-bold">Safe Havens</div>
                                                <div className="text-sm text-white/80">Veilig aanspreekpunt voor hulp</div>
                                            </div>
                                        </div>
                                        <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="mt-8 bg-white dark:bg-[#1f1921] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-purple mb-6 text-center">
                            Volg Ons Op Social Media
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-theme-purple/10 rounded-full hover:bg-gradient-theme hover:text-theme-white transition-all text-theme-purple font-semibold"
                            >
                                <span className="inline-block w-5 h-5 mr-2" aria-hidden>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                        <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
                                    </svg>
                                </span>
                                Instagram
                            </a>

                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-theme-purple/10 rounded-full hover:bg-gradient-theme hover:text-theme-white transition-all text-theme-purple font-semibold"
                            >
                                <span className="inline-block w-5 h-5 mr-2" aria-hidden>
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.2v-2.9h2.2V9.3c0-2.2 1.3-3.4 3.3-3.4.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2v1.5h2.3l-.4 2.9h-1.9v7A10 10 0 0 0 22 12z"></path>
                                    </svg>
                                </span>
                                Facebook
                            </a>

                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-theme-purple/10 rounded-full hover:bg-gradient-theme hover:text-theme-white transition-all text-theme-purple font-semibold"
                            >
                                <span className="inline-block w-5 h-5 mr-2" aria-hidden>
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.1c.7-1.3 2.4-2.6 5-2.6 5.3 0 6.3 3.5 6.3 8.1V24h-5V15.4c0-2.1 0-4.8-2.9-4.8-2.9 0-3.3 2.2-3.3 4.6V24h-5V8z"></path>
                                    </svg>
                                </span>
                                LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
