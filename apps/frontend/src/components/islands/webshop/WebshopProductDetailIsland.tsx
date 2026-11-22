'use client';

import Link from 'next/link';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import { Alert, Badge, Box, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useAuthActions } from '@/features/auth/providers/auth-provider';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import { formatDate } from '@/shared/lib/utils/date';
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';
import { isProductSoldOut } from '@/shared/lib/utils/webshop-stock';

interface WebshopProductDetailIslandProps {
    product: WebshopCatalogProduct;
    isLoggedIn: boolean;
    isMember: boolean;
}

export default function WebshopProductDetailIsland({ product, isLoggedIn, isMember }: WebshopProductDetailIslandProps) {
    const { login } = useAuthActions();

    const hasDrop = product.drop_window !== null;
    const isDropOpen = !product.drop_window || product.drop_window.status === 'open';
    const closesAt = product.drop_window?.closes_at ? new Date(product.drop_window.closes_at) : null;
    const price = Number(product.price).toFixed(2);
    const isSoldOut = isProductSoldOut(product);

    const handleLogin = () => {
        const returnTo = window.location.pathname + window.location.search;
        localStorage.setItem('auth_return_to', returnTo);
        void login();
    };

    return (
        <Stack gap="lg">
            <Stack gap="xs">
                <Box>
                    <Badge size="sm">
                        {product.type === 'clothing' ? 'Kleding' : 'Item'}
                    </Badge>
                </Box>
                <Title order={1} size="h1" c="brand">
                    {product.name}
                </Title>
            </Stack>

            {product.description && (
                <Text c="dimmed" component="div">
                    <SafeMarkdown content={product.description} />
                </Text>
            )}

            <Paper p="md" withBorder>
                <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Prijs</Text>
                    <Text size="xl" fw={700} c="brand">€{price}</Text>
                </Group>
            </Paper>

            <Paper p="md" withBorder>
                <Stack gap={4}>
                    <Text size="sm" fw={700} c="brand">
                        {hasDrop ? 'Dit is een preorder drop' : 'Volledige betaling'}
                    </Text>
                    <Text size="sm" c="dimmed">
                        Je betaalt nu de volledige prijs. Er is geen bezorging, je haalt je bestelling op tijdens een afgesproken afhaalmoment.
                    </Text>
                    {closesAt && (
                        <Text size="sm" c="dimmed">
                            {isDropOpen
                                ? `Bestellen kan tot ${formatDate(closesAt, 'd MMMM yyyy HH:mm')}.`
                                : `Deze drop is gesloten sinds ${formatDate(closesAt, 'd MMMM yyyy HH:mm')}.`}
                        </Text>
                    )}
                </Stack>
            </Paper>

            {isSoldOut ? (
                <Button type="button" disabled fullWidth size="md" leftSection={<Lock size={16} />}>
                    Uitverkocht
                </Button>
            ) : !isDropOpen ? (
                <Button type="button" disabled fullWidth size="md" leftSection={<Lock size={16} />}>
                    Drop gesloten
                </Button>
            ) : !isLoggedIn ? (
                <Button
                    type="button"
                    onClick={handleLogin}
                    fullWidth
                    size="md"
                    leftSection={<LogIn size={16} />}
                >
                    Log in om te bestellen
                </Button>
            ) : !isMember ? (
                <Alert color="accent" icon={<ShieldAlert size={16} />}>
                    Bestellen is alleen voor leden van Salve Mundi.
                </Alert>
            ) : (
                <Button
                    component={Link}
                    href={`/merch/bestellen?product=${product.slug}`}
                    fullWidth
                    size="md"
                >
                    Bestel nu
                </Button>
            )}
        </Stack>
    );
}
