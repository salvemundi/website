'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Search, X, SlidersHorizontal, LayoutGrid, List, Lock } from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Center,
    Checkbox,
    Group,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import VacancyCard from './VacancyCard';
import type { VacancyDTO } from '@salvemundi/validations';

interface BijbanenbankIslandProps {
    vacancies: VacancyDTO[];
    isLoggedIn: boolean;
}

type TypeTab = 'all' | 'parttime' | 'internship';
type SortBy = 'newest' | 'oldest' | 'alphabetical' | 'company';
type ViewMode = 'grid' | 'list';

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

export default function BijbanenbankIsland({ vacancies, isLoggedIn }: BijbanenbankIslandProps) {
    const [typeTab, setTypeTab] = useState<TypeTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [company, setCompany] = useState(ALL_VALUE);
    const [location, setLocation] = useState(ALL_VALUE);
    const [employmentType, setEmploymentType] = useState(ALL_VALUE);
    const [workingHours, setWorkingHours] = useState(ALL_VALUE);
    const [direction, setDirection] = useState(ALL_VALUE);
    const [salaryOnly, setSalaryOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showFilters, setShowFilters] = useState(false);

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
        <Stack gap="lg">
            {!isLoggedIn && (
                <Alert color="brand" variant="light" radius="lg" icon={<Lock size={20} />}>
                    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                        <Text size="sm" fw={600}>
                            Log in om bedrijfsnaam, omschrijving, locatie en contactgegevens te bekijken, en om te zoeken en filteren.
                        </Text>
                        <Button
                            component={Link}
                            href="/?needLogin=true&callbackURL=/bijbanenbank"
                            size="xs"
                        >
                            Inloggen
                        </Button>
                    </Group>
                </Alert>
            )}

            <Group gap="xs" wrap="wrap" role="tablist" aria-label="Type vacature">
                {TABS.map((tab) => (
                    <Button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={typeTab === tab.value}
                        size="sm"
                        variant={typeTab === tab.value ? 'filled' : 'default'}
                        onClick={() => setTypeTab(tab.value)}
                    >
                        {tab.label}
                    </Button>
                ))}
            </Group>

            {isLoggedIn && (
                <Stack gap="md">
                    <Group gap="sm" wrap="wrap" align="center">
                        <TextInput
                            placeholder="Zoek op titel, bedrijf, locatie, ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            leftSection={<Search size={16} />}
                            style={{ flex: 1, minWidth: 220 }}
                            maw={{ sm: 448 }}
                        />

                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            hiddenFrom="md"
                            onClick={() => setShowFilters((prev) => !prev)}
                            aria-expanded={showFilters}
                            leftSection={<SlidersHorizontal size={16} />}
                            rightSection={filtersActive ? (
                                <Box w={6} h={6} style={{ borderRadius: '9999px', backgroundColor: 'var(--primary)' }} />
                            ) : undefined}
                        >
                            Filters
                        </Button>

                        <Paper p={4} radius="md" withBorder>
                            <Group gap={4} wrap="nowrap">
                                <ActionIcon
                                    type="button"
                                    aria-label="Kaartweergave"
                                    aria-pressed={viewMode === 'grid'}
                                    variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid size={16} />
                                </ActionIcon>
                                <ActionIcon
                                    type="button"
                                    aria-label="Lijstweergave"
                                    aria-pressed={viewMode === 'list'}
                                    variant={viewMode === 'list' ? 'filled' : 'subtle'}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List size={16} />
                                </ActionIcon>
                            </Group>
                        </Paper>
                    </Group>

                    <Box display={{ base: showFilters ? 'block' : 'none', md: 'block' }}>
                        <Stack gap="sm">
                            <SimpleGrid cols={{ base: 2, sm: 3, lg: showDirectionFilter ? 6 : 5 }} spacing="sm">
                                <Select
                                    size="sm"
                                    value={company}
                                    onChange={(val) => setCompany(val ?? ALL_VALUE)}
                                    data={[
                                        { value: ALL_VALUE, label: 'Alle bedrijven' },
                                        ...companies.map((c) => ({ value: c, label: c })),
                                    ]}
                                    allowDeselect={false}
                                />
                                <Select
                                    size="sm"
                                    value={location}
                                    onChange={(val) => setLocation(val ?? ALL_VALUE)}
                                    data={[
                                        { value: ALL_VALUE, label: 'Alle locaties' },
                                        ...locations.map((l) => ({ value: l, label: l })),
                                    ]}
                                    allowDeselect={false}
                                />
                                <Select
                                    size="sm"
                                    value={employmentType}
                                    onChange={(val) => setEmploymentType(val ?? ALL_VALUE)}
                                    data={[
                                        { value: ALL_VALUE, label: 'Alle dienstverbanden' },
                                        ...employmentTypes.map((t) => ({ value: t, label: t })),
                                    ]}
                                    allowDeselect={false}
                                />
                                <Select
                                    size="sm"
                                    value={workingHours}
                                    onChange={(val) => setWorkingHours(val ?? ALL_VALUE)}
                                    data={[
                                        { value: ALL_VALUE, label: 'Alle werktijden' },
                                        ...workingHoursOptions.map((w) => ({ value: w, label: w })),
                                    ]}
                                    allowDeselect={false}
                                />
                                {showDirectionFilter && (
                                    <Select
                                        size="sm"
                                        value={direction}
                                        onChange={(val) => setDirection(val ?? ALL_VALUE)}
                                        data={[
                                            { value: ALL_VALUE, label: 'Alle ICT-richtingen' },
                                            ...directions.map((d) => ({ value: d, label: d })),
                                        ]}
                                        allowDeselect={false}
                                    />
                                )}
                                <Select
                                    size="sm"
                                    value={sortBy}
                                    onChange={(val) => setSortBy((val ?? 'newest') as SortBy)}
                                    data={SORT_OPTIONS}
                                    allowDeselect={false}
                                />
                            </SimpleGrid>

                            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                <Checkbox
                                    label="Alleen met salaris/vergoeding"
                                    checked={salaryOnly}
                                    onChange={(e) => setSalaryOnly(e.currentTarget.checked)}
                                />

                                {filtersActive && (
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="subtle"
                                        color="dimmed"
                                        onClick={clearFilters}
                                        leftSection={<X size={14} />}
                                    >
                                        Filters wissen
                                    </Button>
                                )}
                            </Group>
                        </Stack>
                    </Box>
                </Stack>
            )}

            <Text size="sm" fw={600} c="dimmed">
                {filteredVacancies.length} {filteredVacancies.length === 1 ? 'vacature' : 'vacatures'} gevonden
            </Text>

            {filteredVacancies.length === 0 ? (
                <Center py="xl">
                    <Stack align="center" gap="sm" py="xl">
                        <Text span c="brand" opacity={0.3} lh={1}>
                            <Briefcase size={48} />
                        </Text>
                        <Text c="dimmed" ta="center">
                            Geen vacatures gevonden die aan je filters voldoen.
                        </Text>
                    </Stack>
                </Center>
            ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {filteredVacancies.map((vacancy) => (
                        <VacancyCard key={vacancy.id} vacancy={vacancy} variant="grid" isLoggedIn={isLoggedIn} />
                    ))}
                </SimpleGrid>
            ) : (
                <Stack gap="md">
                    {filteredVacancies.map((vacancy) => (
                        <VacancyCard key={vacancy.id} vacancy={vacancy} variant="list" isLoggedIn={isLoggedIn} />
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
