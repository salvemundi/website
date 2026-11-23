import Link from '@/components/ui/Link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack } from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { TransactionsIsland } from '@/components/islands/account/TransactionsIsland';
import { getUserTransactions } from '@/server/actions/profile/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Transacties | SV Salve Mundi',
    description: 'Bekijk je eerdere betalingen bij Salve Mundi.'
};

export default async function TransactiesPage() {
    const session = await getEnrichedSession();

    if (!session) {
        redirect('/');
    }

    const transactions = await getUserTransactions();

    return (
        <PublicPageShell title="Transacties">
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>
                    <TransactionsIsland transactions={transactions} />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
