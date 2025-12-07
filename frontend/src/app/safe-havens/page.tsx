'use client';

import React from 'react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import SafeHavenCard from '@/entities/safe-haven/ui/SafeHavenCard';
import { useSalvemundiSafeHavens } from '@/shared/lib/hooks/useSalvemundiApi';
import { Shield, Lock, AlertTriangle, UserX, Users, MessageSquare, MapPin } from 'lucide-react';
import { SafeHavenCardSkeleton } from '@/shared/ui/skeletons';

export default function SafeHavensPage() {
    const { data: safeHavens, isLoading, error } = useSalvemundiSafeHavens();

    const topics = [
        { Icon: AlertTriangle, text: 'Aggressie / geweld' },
        { Icon: AlertTriangle, text: '(Seksuele) Intimidatie' },
        { Icon: UserX, text: 'Pesten' },
        { Icon: Users, text: 'Discriminatie' },
        { Icon: Shield, text: '(Seksueel) Grensoverschrijdend gedrag' },
        { Icon: MessageSquare, text: 'Persoonlijke situaties' },
    ];
    

    return (
        <div className="">
            <PageHeader
                title="Safe Havens"
                backgroundImage="/img/backgrounds/safe-havens-banner.jpg" // Assuming a banner exists or use a default
            >
                <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                    Een veilig aanspreekpunt voor jouw zorgen en vragen.
                </p>
            </PageHeader>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="max-w-6xl mx-auto">

                    {/* Introduction Section */}
                    <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl p-6 sm:p-8 mb-12">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-oranje to-paars flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-8 h-8 text-theme-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-theme-purple mb-4 text-center md:text-left">
                                        Wat zijn Safe Havens?
                                    </h2>
                                    <p className="text-theme-purple/80 leading-relaxed mb-4 text-justify md:text-left">
                                        Binnen Salve Mundi vinden wij een veilige en comfortable omgeving heel belangrijk voor al onze leden.
                                        Hierom hebben wij Safe Havens aangesteld die een luisterend oor bieden, begrip tonen, en advies geven
                                        voor jouw situatie.
                                    </p>
                                    <div className="bg-theme-purple-lighter/20 rounded-xl p-4">
                                        <p className="text-theme-purple font-semibold flex items-center gap-2">
                                            <Lock className="w-5 h-5 text-theme-purple-dark" />
                                            Een Safe Haven heeft een <strong>geheimhoudingsplicht</strong>
                                        </p>
                                        <p className="text-theme-purple/80 text-sm mt-2">
                                            Jouw klachten of meldingen zullen nooit verspreid worden, ook niet naar het bestuur;
                                            Tenzij door jou anders aangegeven.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Topics Section */}
                    <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl p-6 sm:p-8 mb-12">
                        <h2 className="text-2xl font-bold text-theme-purple mb-6 text-center px-2">
                            Waar Kun Je Bij Ons Terecht?
                        </h2>
                        <p className="text-theme-purple/70 text-center mb-6 px-2">
                            Onze Safe Havens zijn er voor (maar niet gelimiteerd tot):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                            {topics.map((topic, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-4 bg-theme-purple/10 rounded-xl transition-all"
                                >
                                    <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gradient-to-br from-oranje to-paars">
                                        <topic.Icon className="w-5 h-5 text-theme-purple dark:text-theme-white" />
                                    </div>
                                    <span className="text-theme-purple font-medium">{topic.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 p-6 bg-theme-purple/5 rounded-xl">
                            <p className="text-theme-purple/80 text-center">
                                We streven ernaar dat deze personen verschillen van geslacht en dat wij Safe Havens zowel binnen
                                als buiten het bestuur hebben. Zo hopen we dat er altijd iemand is waar je je veilig genoeg bij
                                voelt om je klachten of meldingen mee te delen.
                            </p>
                        </div>
                    </div>

                    {/* Safe Havens Cards Section */}
                    {isLoading && (
                        <div>
                            <h2 className="text-3xl font-bold text-theme-purple mb-8 text-center">
                                Onze Safe Havens
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <SafeHavenCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-theme-purple/10 text-theme-purple px-6 py-4 rounded-xl mb-12">
                            <p className="font-semibold">Er is een fout opgetreden bij het laden van de Safe Havens.</p>
                            <p className="text-sm mt-2">Probeer de pagina opnieuw te laden.</p>
                        </div>
                    )}

                    {safeHavens && safeHavens.length > 0 && (
                        <div className="content-loaded">
                            <h2 className="text-3xl font-bold text-theme-purple mb-8 text-center">
                                Onze Safe Havens
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                                {safeHavens.map((safeHaven: any, index: number) => (
                                    <div key={safeHaven.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                                        <SafeHavenCard safeHaven={safeHaven} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {safeHavens && safeHavens.length === 0 && !isLoading && (
                        <div className="text-center py-12 bg-[var(--bg-card)] rounded-3xl shadow-xl p-8">
                            <div className="text-6xl mb-4"><Shield className="w-16 h-16 text-theme-purple mx-auto" /></div>
                            <p className="text-xl text-theme-purple mb-4">Safe Havens worden binnenkort toegevoegd</p>
                            <p className="text-theme-purple/70">Check deze pagina later opnieuw.</p>
                        </div>
                    )}

                    {/* Alternative Contact Section */}
                    <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl p-6 sm:p-8">
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-theme flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-8 h-8 text-theme-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-theme-purple mb-4">
                                Voel Je Je Niet Veilig Genoeg?
                            </h2>
                            <p className="text-theme-purple/80 mb-6">
                                Wil je liever met iemand buiten Salve Mundi praten?,
                                ben vooral niet bang om rechtstreeks naar Fontys zelf te stappen.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="https://www.fontys.nl/fontyshelpt.htm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-gradient-theme text-theme-white rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                                >
                                    Fontys Vertrouwenspersoon
                                </a>
                                <a
                                    href="mailto:bestuur@salvemundi.nl"
                                    className="px-6 py-3 bg-theme-purple text-theme-white rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                                >
                                    Contact Bestuur
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
