'use client';

import { useMemo, useState } from 'react';
import { Briefcase, Search, X } from 'lucide-react';
import VacancyCard from './VacancyCard';
import type { VacancyDTO } from '@salvemundi/validations';

interface BijbanenbankIslandProps {
    vacancies: VacancyDTO[];
}

type TypeTab = 'all' | 'parttime' | 'internship';
type SortBy = 'newest' | 'oldest' | 'alphabetical' | 'company';

const TABS: { value: TypeTab; label: string }[] = [
    { value: 'all', label: 'Alles' },
    { value: 'parttime', label: 'Bijbanen' },
    { value: 'internship', label: 'Stages' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
    { value: 'newest', label: 'Nieuwste eerst' },
    { value: 'oldest', label: 'Oudste eerst' },
    { value: 'alphabetical', label: 'Alfabetisch' },
    { value: 'company', label: 'Bedrijfsnaam' },
];

const ALL_VALUE = '__all__';

function buildSearchIndex(vacancy: VacancyDTO): string {
    return [
        vacancy.title,
        vacancy.company,
        vacancy.description,
        vacancy.location,
        vacancy.contact_email,
        vacancy.contact_phone,
        vacancy.contact_website,
        vacancy.salary,
        vacancy.employment_type,
        vacancy.working_hours,
        ...vacancy.directions,
        ...vacancy.skills
    ].filter(Boolean).join(' ').toLowerCase();
}

export default function BijbanenbankIsland({ vacancies }: BijbanenbankIslandProps) {
    const [typeTab, setTypeTab] = useState<TypeTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [company, setCompany] = useState(ALL_VALUE);
    const [location, setLocation] = useState(ALL_VALUE);
    const [employmentType, setEmploymentType] = useState(ALL_VALUE);
    const [workingHours, setWorkingHours] = useState(ALL_VALUE);
    const [direction, setDirection] = useState(ALL_VALUE);
    const [salaryOnly, setSalaryOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortBy>('newest');

    const companies = useMemo(() => Array.from(new Set(vacancies.map((v) => v.company))).sort(), [vacancies]);
    const locations = useMemo(() => Array.from(new Set(vacancies.map((v) => v.location))).sort(), [vacancies]);
    const employmentTypes = useMemo(() => Array.from(new Set(vacancies.map((v) => v.employment_type).filter((v): v is string => !!v))).sort(), [vacancies]);
    const workingHoursOptions = useMemo(() => Array.from(new Set(vacancies.map((v) => v.working_hours).filter((v): v is string => !!v))).sort(), [vacancies]);
    const directions = useMemo(() => Array.from(new Set(vacancies.flatMap((v) => v.directions))).sort(), [vacancies]);

    const showDirectionFilter = typeTab !== 'parttime';

    const filtersActive = searchQuery !== '' || company !== ALL_VALUE || location !== ALL_VALUE
        || employmentType !== ALL_VALUE || workingHours !== ALL_VALUE || direction !== ALL_VALUE
        || salaryOnly || typeTab !== 'all' || sortBy !== 'newest';

    const clearFilters = () => {
        setTypeTab('all');
        setSearchQuery('');
        setCompany(ALL_VALUE);
        setLocation(ALL_VALUE);
        setEmploymentType(ALL_VALUE);
        setWorkingHours(ALL_VALUE);
        setDirection(ALL_VALUE);
        setSalaryOnly(false);
        setSortBy('newest');
    };

    const filteredVacancies = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const filtered = vacancies.filter((vacancy) => {
            if (typeTab !== 'all' && vacancy.type !== typeTab) return false;
            if (company !== ALL_VALUE && vacancy.company !== company) return false;
            if (location !== ALL_VALUE && vacancy.location !== location) return false;
            if (employmentType !== ALL_VALUE && vacancy.employment_type !== employmentType) return false;
            if (workingHours !== ALL_VALUE && vacancy.working_hours !== workingHours) return false;
            if (direction !== ALL_VALUE && !vacancy.directions.includes(direction)) return false;
            if (salaryOnly && !vacancy.salary) return false;
            if (query && !buildSearchIndex(vacancy).includes(query)) return false;
            return true;
        });

        const sorted = [...filtered];
        switch (sortBy) {
            case 'oldest':
                sorted.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
                break;
            case 'alphabetical':
                sorted.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
                break;
            case 'company':
                sorted.sort((a, b) => a.company.localeCompare(b.company, 'nl'));
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
                break;
        }

        return sorted;
    }, [vacancies, typeTab, company, location, employmentType, workingHours, direction, salaryOnly, searchQuery, sortBy]);

    return (
        <div className="space-y-6">
            <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Type vacature">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={typeTab === tab.value}
                        onClick={() => setTypeTab(tab.value)}
                        className={`form-button px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            typeTab === tab.value
                                ? 'bg-(--theme-purple) text-white shadow-lg shadow-(--theme-purple)/20'
                                : 'bg-(--bg-soft) text-(--text-muted) hover:text-(--theme-purple)'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:max-w-md px-4 py-2.5 bg-(--bg-card) border border-(--border-color) rounded-2xl shadow-sm focus-within:border-(--theme-purple) transition-colors">
                <Search className="h-4 w-4 shrink-0 text-(--text-muted)" />
                <input
                    type="text"
                    placeholder="Zoek op titel, bedrijf, locatie, ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input-unstyled bg-transparent text-(--text-main) placeholder:text-(--text-muted) outline-none border-none p-0 w-full font-semibold text-sm"
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <select className="form-input text-sm" value={company} onChange={(e) => setCompany(e.target.value)}>
                    <option value={ALL_VALUE}>Alle bedrijven</option>
                    {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="form-input text-sm" value={location} onChange={(e) => setLocation(e.target.value)}>
                    <option value={ALL_VALUE}>Alle locaties</option>
                    {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <select className="form-input text-sm" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                    <option value={ALL_VALUE}>Alle dienstverbanden</option>
                    {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="form-input text-sm" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)}>
                    <option value={ALL_VALUE}>Alle werktijden</option>
                    {workingHoursOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
                {showDirectionFilter && (
                    <select className="form-input text-sm" value={direction} onChange={(e) => setDirection(e.target.value)}>
                        <option value={ALL_VALUE}>Alle ICT-richtingen</option>
                        {directions.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                )}
                <select className="form-input text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                    {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-(--text-main) cursor-pointer">
                    <input
                        type="checkbox"
                        checked={salaryOnly}
                        onChange={(e) => setSalaryOnly(e.target.checked)}
                        className="h-4 w-4 accent-(--theme-purple)"
                    />
                    Alleen met salaris/vergoeding
                </label>

                {filtersActive && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="form-button flex items-center gap-1.5 text-xs font-bold text-(--text-muted) hover:text-(--theme-purple) transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                        Filters wissen
                    </button>
                )}
            </div>

            <p className="text-sm text-(--text-muted) font-semibold">
                {filteredVacancies.length} {filteredVacancies.length === 1 ? 'vacature' : 'vacatures'} gevonden
            </p>

            {filteredVacancies.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                    <Briefcase className="h-12 w-12 text-(--theme-purple)/20" />
                    <p className="text-(--text-muted)">Geen vacatures gevonden die aan je filters voldoen.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredVacancies.map((vacancy) => (
                        <VacancyCard key={vacancy.id} vacancy={vacancy} />
                    ))}
                </div>
            )}
        </div>
    );
}
