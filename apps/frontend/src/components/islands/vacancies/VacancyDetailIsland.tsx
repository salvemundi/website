'use client';

import { Building2, MapPin, Calendar, Banknote, Clock, Briefcase, Mail, Globe, Phone } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import DocumentAsset from '@/components/ui/media/DocumentAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import BackButton from '@/components/ui/navigation/BackButton';
import type { VacancyDTO } from '@salvemundi/validations';

interface VacancyDetailIslandProps {
    vacancy: VacancyDTO;
}

function formatPublishedDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VacancyDetailIsland({ vacancy }: VacancyDetailIslandProps) {
    const isInternship = vacancy.type === 'internship';

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-6">
                <BackButton href="/bijbanenbank" />
            </div>

            <div className="overflow-hidden rounded-4xl bg-(--bg-card) shadow-lg dark:border dark:border-white/10">
                {vacancy.image && (
                    <div className="relative aspect-video w-full">
                        <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" priority />
                    </div>
                )}

                <div className="space-y-8 p-6 sm:p-10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <span className={`mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase ${isInternship ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                                {isInternship ? 'Stage' : 'Bijbaan'}
                            </span>
                            <h1 className="text-2xl leading-tight font-black text-(--theme-purple) sm:text-3xl">{vacancy.title}</h1>
                            <p className="mt-2 flex items-center gap-2 font-bold text-(--text-muted)">
                                <Building2 className="size-4" />
                                {vacancy.company}
                            </p>
                        </div>
                        <a
                            href={`mailto:${vacancy.contact_email}`}
                            className="hover:scale-1.02 form-button flex items-center gap-2 rounded-xl bg-(--theme-purple) px-5 py-3 font-bold text-white shadow-(--theme-purple)/20 shadow-lg transition-transform"
                        >
                            <Mail className="size-4" />
                            Solliciteer / Neem contact op
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-(--theme-purple)" />
                            <div>
                                <p className="text-[10px] font-bold text-(--text-muted) uppercase">Locatie</p>
                                <p className="text-sm font-semibold text-(--text-main)">{vacancy.location}</p>
                            </div>
                        </div>
                        {vacancy.salary && (
                            <div className="flex items-start gap-2">
                                <Banknote className="mt-0.5 size-4 shrink-0 text-(--theme-purple)" />
                                <div>
                                    <p className="text-[10px] font-bold text-(--text-muted) uppercase">Salaris</p>
                                    <p className="text-sm font-semibold text-(--text-main)">{vacancy.salary}</p>
                                </div>
                            </div>
                        )}
                        {vacancy.employment_type && (
                            <div className="flex items-start gap-2">
                                <Briefcase className="mt-0.5 size-4 shrink-0 text-(--theme-purple)" />
                                <div>
                                    <p className="text-[10px] font-bold text-(--text-muted) uppercase">Dienstverband/stagetype</p>
                                    <p className="text-sm font-semibold text-(--text-main)">{vacancy.employment_type}</p>
                                </div>
                            </div>
                        )}
                        {vacancy.working_hours && (
                            <div className="flex items-start gap-2">
                                <Clock className="mt-0.5 size-4 shrink-0 text-(--theme-purple)" />
                                <div>
                                    <p className="text-[10px] font-bold text-(--text-muted) uppercase">Werktijden</p>
                                    <p className="text-sm font-semibold text-(--text-main)">{vacancy.working_hours}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {isInternship && vacancy.directions.length > 0 && (
                        <div>
                            <h2 className="mb-2 text-sm font-bold text-(--text-main)">ICT-richtingen</h2>
                            <div className="flex flex-wrap gap-2">
                                {vacancy.directions.map((direction) => (
                                    <span key={direction} className="rounded-full border border-(--theme-purple)/20 bg-(--bg-soft) px-3 py-1.5 text-xs font-bold text-(--theme-purple)">
                                        {direction}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {vacancy.skills.length > 0 && (
                        <div>
                            <h2 className="mb-2 text-sm font-bold text-(--text-main)">Gewenste vaardigheden</h2>
                            <div className="flex flex-wrap gap-2">
                                {vacancy.skills.map((skill) => (
                                    <span key={skill} className="rounded-full bg-(--theme-purple)/10 px-3 py-1.5 text-xs font-bold text-(--theme-purple)">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="mb-2 text-sm font-bold text-(--text-main)">Omschrijving</h2>
                        <SafeMarkdown content={vacancy.description} />
                    </div>

                    {vacancy.document && (
                        <div>
                            <h2 className="mb-2 text-sm font-bold text-(--text-main)">Stageopdracht</h2>
                            <DocumentAsset id={vacancy.document} label="Download stageopdracht" />
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-(--border-color) pt-6">
                        <span className="flex items-center gap-2 text-sm font-semibold text-(--text-muted)">
                            <Calendar className="size-4" />
                            Geplaatst op {formatPublishedDate(vacancy.published_at)}
                        </span>
                        <a href={`mailto:${vacancy.contact_email}`} className="flex items-center gap-2 text-sm font-semibold text-(--theme-purple) hover:underline">
                            <Mail className="size-4" />
                            {vacancy.contact_email}
                        </a>
                        {vacancy.contact_phone && (
                            <a href={`tel:${vacancy.contact_phone}`} className="flex items-center gap-2 text-sm font-semibold text-(--theme-purple) hover:underline">
                                <Phone className="size-4" />
                                {vacancy.contact_phone}
                            </a>
                        )}
                        {vacancy.contact_website && (
                            <a href={vacancy.contact_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-(--theme-purple) hover:underline">
                                <Globe className="size-4" />
                                Website
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
