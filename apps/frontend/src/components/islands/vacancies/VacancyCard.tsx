'use client';

import { useRouter } from 'next/navigation';
import { Building2, MapPin, Calendar, Banknote, Clock, Briefcase, Mail, Globe, Phone } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import type { VacancyDTO } from '@salvemundi/validations';

interface VacancyCardProps {
    vacancy: VacancyDTO;
    variant?: 'grid' | 'list';
}

function formatPublishedDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VacancyCard({ vacancy, variant = 'grid' }: VacancyCardProps) {
    const router = useRouter();
    const isInternship = vacancy.type === 'internship';
    const isList = variant === 'list';

    return (
        <div
            onClick={() => router.push(`/bijbanenbank/${vacancy.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/bijbanenbank/${vacancy.id}`); }}
            className={`group relative z-0 overflow-hidden w-full rounded-[1.75rem] bg-(--bg-card) dark:border dark:border-white/10 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 flex ${isList ? 'flex-col md:flex-row' : 'flex-col'}`}
        >
            {vacancy.image && (
                <div className={`relative overflow-hidden shrink-0 ${isList ? 'w-full md:w-56 aspect-video md:aspect-auto' : 'w-full aspect-video'}`}>
                    <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" />
                </div>
            )}

            <div className={`p-5 flex flex-col gap-3 grow ${isList ? 'md:flex-row md:items-center md:gap-6' : ''}`}>
                <div className={isList ? 'md:flex-1 md:min-w-0 space-y-3' : 'contents'}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className={`font-bold text-(--theme-purple)/90 leading-tight wrap-break-word ${isList ? 'text-lg line-clamp-1' : 'text-lg line-clamp-2'}`}>
                                {vacancy.title}
                            </h3>
                            <p className="flex items-center gap-1.5 text-sm text-(--text-muted) font-semibold mt-1">
                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{vacancy.company}</span>
                            </p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider text-white ${isInternship ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                            {isInternship ? 'Stage' : 'Bijbaan'}
                        </span>
                    </div>

                    <div className={`text-(--text-muted) text-sm leading-relaxed wrap-break-word overflow-hidden ${isList ? 'line-clamp-2' : 'line-clamp-3'}`}>
                        <SafeMarkdown content={vacancy.description} className="text-(--text-muted)! prose-sm prose-p:my-1 prose-headings:my-1" />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-(--text-muted) font-medium">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vacancy.location}</span>
                        {vacancy.salary && <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />{vacancy.salary}</span>}
                        {vacancy.working_hours && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{vacancy.working_hours}</span>}
                        {vacancy.employment_type && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{vacancy.employment_type}</span>}
                    </div>

                    {isInternship && vacancy.directions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {vacancy.directions.map((direction) => (
                                <span key={direction} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-(--bg-soft) text-(--theme-purple) border border-(--theme-purple)/20">
                                    {direction}
                                </span>
                            ))}
                        </div>
                    )}

                    {vacancy.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {vacancy.skills.slice(0, 6).map((skill) => (
                                <span key={skill} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-(--theme-purple)/10 text-(--theme-purple)">
                                    {skill}
                                </span>
                            ))}
                            {vacancy.skills.length > 6 && (
                                <span className="text-[10px] font-bold px-2.5 py-1 text-(--text-muted)">+{vacancy.skills.length - 6}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className={`flex items-center justify-between border-(--border-color) ${isList ? 'md:flex-col md:items-end md:justify-center md:gap-3 md:border-t-0 md:border-l md:pl-6 pt-3 mt-auto md:mt-0 border-t md:pt-0' : 'pt-3 mt-auto border-t'}`}>
                    <span className="flex items-center gap-1.5 text-[11px] text-(--text-muted) font-semibold whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatPublishedDate(vacancy.published_at)}
                    </span>
                    <div className="flex items-center gap-2">
                        {vacancy.contact_website && (
                            <a href={vacancy.contact_website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="icon-button p-2 rounded-full bg-(--bg-soft) text-(--theme-purple)" title="Website">
                                <Globe className="h-4 w-4" />
                            </a>
                        )}
                        {vacancy.contact_phone && (
                            <a href={`tel:${vacancy.contact_phone}`} onClick={(e) => e.stopPropagation()} className="icon-button p-2 rounded-full bg-(--bg-soft) text-(--theme-purple)" title="Bellen">
                                <Phone className="h-4 w-4" />
                            </a>
                        )}
                        <a href={`mailto:${vacancy.contact_email}`} onClick={(e) => e.stopPropagation()} className="icon-button p-2 rounded-full bg-(--theme-purple) text-white shadow-lg shadow-(--theme-purple)/20 hover:scale-105" title="E-mailen">
                            <Mail className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
