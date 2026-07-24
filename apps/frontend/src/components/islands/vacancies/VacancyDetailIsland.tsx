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
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <BackButton href="/bijbanenbank" />
            </div>

            <div className="bg-(--bg-card) dark:border dark:border-white/10 rounded-[2rem] shadow-lg overflow-hidden">
                {vacancy.image && (
                    <div className="relative w-full aspect-video">
                        <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" priority />
                    </div>
                )}

                <div className="p-6 sm:p-10 space-y-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider text-white mb-3 ${isInternship ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                                {isInternship ? 'Stage' : 'Bijbaan'}
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-(--theme-purple) leading-tight">{vacancy.title}</h1>
                            <p className="flex items-center gap-2 text-(--text-muted) font-bold mt-2">
                                <Building2 className="h-4 w-4" />
                                {vacancy.company}
                            </p>
                        </div>
                        <a
                            href={`mailto:${vacancy.contact_email}`}
                            className="form-button flex items-center gap-2 px-5 py-3 rounded-xl bg-(--theme-purple) text-white font-bold shadow-lg shadow-(--theme-purple)/20 hover:scale-[1.02] transition-transform"
                        >
                            <Mail className="h-4 w-4" />
                            Solliciteer / Neem contact op
                        </a>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-(--theme-purple) shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold uppercase text-(--text-muted)">Locatie</p>
                                <p className="text-sm font-semibold text-(--text-main)">{vacancy.location}</p>
                            </div>
                        </div>
                        {vacancy.salary && (
                            <div className="flex items-start gap-2">
                                <Banknote className="h-4 w-4 text-(--theme-purple) shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-(--text-muted)">Salaris</p>
                                    <p className="text-sm font-semibold text-(--text-main)">{vacancy.salary}</p>
                                </div>
                            </div>
                        )}
                        {vacancy.employment_type && (
                            <div className="flex items-start gap-2">
                                <Briefcase className="h-4 w-4 text-(--theme-purple) shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-(--text-muted)">Dienstverband</p>
                                    <p className="text-sm font-semibold text-(--text-main)">{vacancy.employment_type}</p>
                                </div>
                            </div>
                        )}
                        {vacancy.working_hours && (
                            <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-(--theme-purple) shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-(--text-muted)">Werktijden</p>
                                    <p className="text-sm font-semibold text-(--text-main)">{vacancy.working_hours}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {isInternship && vacancy.directions.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold text-(--text-main) mb-2">ICT-richtingen</h2>
                            <div className="flex flex-wrap gap-2">
                                {vacancy.directions.map((direction) => (
                                    <span key={direction} className="text-xs font-bold px-3 py-1.5 rounded-full bg-(--bg-soft) text-(--theme-purple) border border-(--theme-purple)/20">
                                        {direction}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {vacancy.skills.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold text-(--text-main) mb-2">Gewenste vaardigheden</h2>
                            <div className="flex flex-wrap gap-2">
                                {vacancy.skills.map((skill) => (
                                    <span key={skill} className="text-xs font-bold px-3 py-1.5 rounded-full bg-(--theme-purple)/10 text-(--theme-purple)">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-sm font-bold text-(--text-main) mb-2">Omschrijving</h2>
                        <SafeMarkdown content={vacancy.description} />
                    </div>

                    {vacancy.document && (
                        <div>
                            <h2 className="text-sm font-bold text-(--text-main) mb-2">Stageopdracht</h2>
                            <DocumentAsset id={vacancy.document} label="Download stageopdracht" />
                        </div>
                    )}

                    <div className="border-t border-(--border-color) pt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-(--text-muted)">
                            <Calendar className="h-4 w-4" />
                            Geplaatst op {formatPublishedDate(vacancy.published_at)}
                        </span>
                        <a href={`mailto:${vacancy.contact_email}`} className="flex items-center gap-2 text-sm font-semibold text-(--theme-purple) hover:underline">
                            <Mail className="h-4 w-4" />
                            {vacancy.contact_email}
                        </a>
                        {vacancy.contact_phone && (
                            <a href={`tel:${vacancy.contact_phone}`} className="flex items-center gap-2 text-sm font-semibold text-(--theme-purple) hover:underline">
                                <Phone className="h-4 w-4" />
                                {vacancy.contact_phone}
                            </a>
                        )}
                        {vacancy.contact_website && (
                            <a href={vacancy.contact_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-(--theme-purple) hover:underline">
                                <Globe className="h-4 w-4" />
                                Website
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
