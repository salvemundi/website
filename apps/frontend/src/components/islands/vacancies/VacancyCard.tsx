'use client';

import { useRouter } from 'next/navigation';
import { Building2, MapPin, Calendar, Banknote, Clock, Briefcase, Mail, Globe, Phone, Lock } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import type { VacancyDTO } from '@salvemundi/validations';

interface VacancyCardProps {
    vacancy: VacancyDTO;
    variant?: 'grid' | 'list';
    isLoggedIn: boolean;
}

function formatPublishedDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VacancyCard({ vacancy, variant = 'grid', isLoggedIn }: VacancyCardProps) {
    const router = useRouter();
    const isInternship = vacancy.type === 'internship';
    const isList = variant === 'list';

    if (!isLoggedIn) {
        const loginUrl = `/?needLogin=true&callbackURL=${encodeURIComponent('/bijbanenbank')}`;
        return (
            <div
                onClick={() => router.push(loginUrl)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push(loginUrl); }}
                className={`group relative z-0 flex w-full cursor-pointer overflow-hidden rounded-[1.75rem] bg-(--bg-card) shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border dark:border-white/10 ${isList ? 'flex-col sm:flex-row sm:items-center' : 'flex-col'}`}
            >
                <div className={`relative shrink-0 overflow-hidden bg-(--bg-soft) ${isList ? 'aspect-video w-full sm:aspect-square sm:w-40' : 'aspect-video w-full'}`}>
                    {vacancy.image ? (
                        <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" />
                    ) : (
                        <div className="flex size-full items-center justify-center">
                            <Briefcase className="size-10 text-(--theme-purple)/20" />
                        </div>
                    )}
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 p-5">
                    <h3 className="line-clamp-2 text-lg leading-tight font-bold wrap-break-word text-(--theme-purple)/90">
                        {vacancy.title}
                    </h3>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-(--theme-purple)">
                        <Lock className="size-3.5" />
                        Inloggen
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => router.push(`/bijbanenbank/${vacancy.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/bijbanenbank/${vacancy.id}`); }}
            className={`group relative z-0 flex w-full cursor-pointer overflow-hidden rounded-[1.75rem] bg-(--bg-card) shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border dark:border-white/10 ${isList ? 'flex-col md:flex-row' : 'flex-col'}`}
        >
            {vacancy.image && (
                <div className={`relative shrink-0 overflow-hidden ${isList ? 'aspect-video w-full md:aspect-auto md:w-56' : 'aspect-video w-full'}`}>
                    <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" />
                </div>
            )}

            <div className={`flex grow flex-col gap-3 p-5 ${isList ? 'md:flex-row md:items-center md:gap-6' : ''}`}>
                <div className={isList ? 'space-y-3 md:min-w-0 md:flex-1' : 'contents'}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className={`leading-tight font-bold wrap-break-word text-(--theme-purple)/90 ${isList ? 'line-clamp-1 text-lg' : 'line-clamp-2 text-lg'}`}>
                                {vacancy.title}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-(--text-muted)">
                                <Building2 className="size-3.5 shrink-0" />
                                <span className="truncate">{vacancy.company}</span>
                            </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm ${isInternship ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                            {isInternship ? 'Stage' : 'Bijbaan'}
                        </span>
                    </div>

                    <div className={`overflow-hidden text-sm leading-relaxed wrap-break-word text-(--text-muted) ${isList ? 'line-clamp-2' : 'line-clamp-3'}`}>
                        <SafeMarkdown content={vacancy.description} className="prose-sm text-(--text-muted)! prose-headings:my-1 prose-p:my-1" />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-(--text-muted)">
                        <span className="flex items-center gap-1"><MapPin className="size-3.5" />{vacancy.location}</span>
                        {vacancy.salary && <span className="flex items-center gap-1"><Banknote className="size-3.5" />{vacancy.salary}</span>}
                        {vacancy.working_hours && <span className="flex items-center gap-1"><Clock className="size-3.5" />{vacancy.working_hours}</span>}
                        {vacancy.employment_type && <span className="flex items-center gap-1"><Briefcase className="size-3.5" />{vacancy.employment_type}</span>}
                    </div>

                    {isInternship && vacancy.directions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {vacancy.directions.map((direction) => (
                                <span key={direction} className="rounded-full border border-(--theme-purple)/20 bg-(--bg-soft) px-2.5 py-1 text-[10px] font-bold text-(--theme-purple)">
                                    {direction}
                                </span>
                            ))}
                        </div>
                    )}

                    {vacancy.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {vacancy.skills.slice(0, 6).map((skill) => (
                                <span key={skill} className="rounded-full bg-(--theme-purple)/10 px-2.5 py-1 text-[10px] font-bold text-(--theme-purple)">
                                    {skill}
                                </span>
                            ))}
                            {vacancy.skills.length > 6 && (
                                <span className="px-2.5 py-1 text-[10px] font-bold text-(--text-muted)">+{vacancy.skills.length - 6}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className={`flex items-center justify-between border-(--border-color) ${isList ? 'mt-auto border-t pt-3 md:mt-0 md:flex-col md:items-end md:justify-center md:gap-3 md:border-t-0 md:border-l md:pt-0 md:pl-6' : 'mt-auto border-t pt-3'}`}>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap text-(--text-muted)">
                        <Calendar className="size-3.5" />
                        {formatPublishedDate(vacancy.published_at)}
                    </span>
                    <div className="flex items-center gap-2">
                        {vacancy.contact_website && (
                            <a href={vacancy.contact_website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="icon-button rounded-full bg-(--bg-soft) p-2 text-(--theme-purple)" title="Website">
                                <Globe className="size-4" />
                            </a>
                        )}
                        {vacancy.contact_phone && (
                            <a href={`tel:${vacancy.contact_phone}`} onClick={(e) => e.stopPropagation()} className="icon-button rounded-full bg-(--bg-soft) p-2 text-(--theme-purple)" title="Bellen">
                                <Phone className="size-4" />
                            </a>
                        )}
                        <a href={`mailto:${vacancy.contact_email}`} onClick={(e) => e.stopPropagation()} className="icon-button rounded-full bg-(--theme-purple) p-2 text-white shadow-(--theme-purple)/20 shadow-lg hover:scale-105" title="E-mailen">
                            <Mail className="size-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
