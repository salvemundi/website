import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import type { VacancyDTO } from '@salvemundi/validations';
import { getVacancies } from '@/server/actions/vacancies/vacancies-public.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import BijbanenbankIsland from '@/components/islands/vacancies/BijbanenbankIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Bijbanenbank | SV Salve Mundi',
    description: 'Bekijk stages en bijbanen die door bedrijven zijn aangeboden aan leden van Salve Mundi.'
};

// Anonymous visitors only get the title/image/type — everything else requires a login.
function redactForAnonymous(vacancies: VacancyDTO[]): VacancyDTO[] {
    return vacancies.map((vacancy) => ({
        ...vacancy,
        company: '',
        description: '',
        contact_email: '',
        contact_phone: null,
        contact_website: null,
        location: '',
        salary: null,
        employment_type: null,
        working_hours: null,
        directions: [],
        skills: [],
        document: null
    }));
}

export default async function BijbanenbankPage() {
    const [vacancies, session] = await Promise.all([
        getVacancies(),
        getEnrichedSession()
    ]);
    const isLoggedIn = !!session?.user;
    const visibleVacancies = isLoggedIn ? vacancies : redactForAnonymous(vacancies);

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group>
                    <Button
                        component={Link}
                        href={isLoggedIn ? '/profiel' : '/'}
                        size="sm"
                        leftSection={<ChevronLeft size={16} />}
                    >
                        Terug
                    </Button>
                </Group>

                <Stack gap="xs">
                    <Title order={1} c="brand">Bijbanenbank</Title>
                    <Text c="dimmed" maw={640}>
                        Stages en bijbanen aangeboden door bedrijven aan leden van Salve Mundi.
                    </Text>
                </Stack>

                <BijbanenbankIsland vacancies={visibleVacancies} isLoggedIn={isLoggedIn} />
            </Stack>
        </Container>
    );
}
