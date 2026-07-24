'use client';

import { Building2, MapPin, Calendar, Banknote, Clock, Briefcase, Mail, Globe, Phone } from 'lucide-react';
import type { VacancyDTO } from '@salvemundi/validations';

interface VacancyCardProps {
    vacancy: VacancyDTO;
}

function formatPublishedDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VacancyCard({ vacancy }: VacancyCardProps) {
    const isInternship = vacancy.type === 'internship';

    return (
        <div className="group relative z-0 overflow-hidden w-full rounded-[1.75rem] bg-(--bg-card) dark:border dark:border-white/10 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-(--theme-purple)/90 leading-tight line-clamp-2 wrap-break-word">
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

            <p className="text-(--text-muted) text-sm line-clamp-3 leading-relaxed wrap-break-word">
                {vacancy.description}
            </p>

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

            <div className="flex items-center justify-between pt-3 mt-auto border-t border-(--border-color)">
                <span className="flex items-center gap-1.5 text-[11px] text-(--text-muted) font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatPublishedDate(vacancy.published_at)}
                </span>
                <div className="flex items-center gap-2">
                    {vacancy.contact_website && (
                        <a href={vacancy.contact_website} target="_blank" rel="noopener noreferrer" className="icon-button p-2 rounded-full bg-(--bg-soft) text-(--theme-purple)" title="Website">
                            <Globe className="h-4 w-4" />
                        </a>
                    )}
                    {vacancy.contact_phone && (
                        <a href={`tel:${vacancy.contact_phone}`} className="icon-button p-2 rounded-full bg-(--bg-soft) text-(--theme-purple)" title="Bellen">
                            <Phone className="h-4 w-4" />
                        </a>
                    )}
                    <a href={`mailto:${vacancy.contact_email}`} className="icon-button p-2 rounded-full bg-(--theme-purple) text-white shadow-lg shadow-(--theme-purple)/20 hover:scale-105" title="E-mailen">
                        <Mail className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
