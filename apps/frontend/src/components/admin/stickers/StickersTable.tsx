'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/utils/image-utils';
import MediaAsset from '@/components/ui/media/MediaAsset';
import {
    Search,
    Trash,
    User,
    MapPin,
    Globe,
    Image as ImageIcon,
    CheckCircle
} from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Center,
    Group,
    Modal,
    Paper,
    Stack,
    Table,
    Text,
    TextInput,
    UnstyledButton,
} from '@mantine/core';
import { formatDate } from '@/shared/lib/utils/date';
import { type StickerPublic } from '@salvemundi/validations';

type AdminSticker = Omit<StickerPublic, 'user_updated' | 'date_updated'>;

interface StickersTableProps {
    stickers: AdminSticker[];
    onDelete: (id: number) => void;
    onApprove: (id: number) => void;
}

const ASSET_URL = '/api/assets';

export default function StickersTable({ stickers, onDelete, onApprove }: StickersTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const filteredStickers = stickers.filter(s => {
        const search = searchQuery.toLowerCase();

        const userFullName = s.user_created
            ? `${s.user_created.first_name || ''} ${s.user_created.last_name || ''}`.toLowerCase()
            : '';

        return (
            (s.location_name || '').toLowerCase().includes(search) ||
            s.city?.toLowerCase().includes(search) ||
            s.country?.toLowerCase().includes(search) ||
            userFullName.includes(search)
        );
    });

    return (
        <Stack gap="lg">
            <Paper withBorder p="md">
                <TextInput
                    placeholder="Zoek op locatie, stad, land of gebruiker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    leftSection={<Search size={16} />}
                />
            </Paper>

            <Paper withBorder style={{ overflow: 'hidden' }}>
                <Table.ScrollContainer minWidth={800}>
                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Locatie &amp; Gebruiker</Table.Th>
                                <Table.Th>Stad / Land</Table.Th>
                                <Table.Th>Datum</Table.Th>
                                <Table.Th ta="center">Foto</Table.Th>
                                <Table.Th ta="right">Acties</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredStickers.map((sticker) => (
                                <Table.Tr key={sticker.id}>
                                    <Table.Td>
                                        <Stack gap={4}>
                                            <Group gap="xs" wrap="wrap">
                                                <Text size="sm" fw={600}>
                                                    {sticker.location_name || 'Onbekende Locatie'}
                                                </Text>
                                                {sticker.status === 'published' ? (
                                                    <Badge color="success" size="sm">
                                                        Live
                                                    </Badge>
                                                ) : (
                                                    <Badge color="accent" size="sm">
                                                        Draft
                                                    </Badge>
                                                )}
                                            </Group>
                                            <Group gap={6} wrap="nowrap">
                                                <User size={14} opacity={0.6} />
                                                <Text size="xs" c="dimmed">
                                                    Geüpload door:{' '}
                                                    {sticker.user_created
                                                        ? `${sticker.user_created.first_name || ''} ${sticker.user_created.last_name || ''}`
                                                        : 'Systeem'}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={4}>
                                            <Group gap={6} wrap="nowrap">
                                                <Text span c="error" lh={1}>
                                                    <MapPin size={14} />
                                                </Text>
                                                <Text size="sm" fw={600}>
                                                    {sticker.city || 'Onbekende stad'}
                                                </Text>
                                            </Group>
                                            <Group gap={6} wrap="nowrap">
                                                <Text span c="brand" lh={1}>
                                                    <Globe size={14} />
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {sticker.country || 'Onbekend land'}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed" suppressHydrationWarning>
                                            {formatDate(sticker.date_created, 'dd MMM yyyy', '-')}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Center>
                                            <UnstyledButton
                                                type="button"
                                                onClick={() => sticker.image && setSelectedImage(`${ASSET_URL}/${sticker.image}`)}
                                                disabled={!sticker.image}
                                                aria-label="Sticker foto bekijken"
                                            >
                                                <Paper
                                                    withBorder
                                                    w={48}
                                                    h={48}
                                                    style={{
                                                        overflow: 'hidden',
                                                        borderStyle: sticker.image ? 'solid' : 'dashed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: sticker.image ? 'pointer' : 'default',
                                                    }}
                                                >
                                                    {!sticker.image ? (
                                                        <ImageIcon size={16} opacity={0.3} />
                                                    ) : (
                                                        <Box pos="relative" w={48} h={48}>
                                                            <MediaAsset
                                                                asset={getImageUrl(sticker.image, { width: 100, height: 100, fit: 'cover' }) || ''}
                                                                alt="Sticker"
                                                                fill
                                                                sizes="48px"
                                                                objectFit="cover"
                                                            />
                                                        </Box>
                                                    )}
                                                </Paper>
                                            </UnstyledButton>
                                        </Center>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <Group justify="flex-end" gap="xs">
                                            {sticker.status !== 'published' && (
                                                <ActionIcon
                                                    type="button"
                                                    color="success"
                                                    size="lg"
                                                    onClick={() => onApprove(sticker.id)}
                                                    title="Publiceren"
                                                    aria-label="Publiceren"
                                                >
                                                    <CheckCircle size={16} />
                                                </ActionIcon>
                                            )}
                                            <ActionIcon
                                                type="button"
                                                color="error"
                                                size="lg"
                                                onClick={() => onDelete(sticker.id)}
                                                title="Verwijderen"
                                                aria-label="Verwijderen"
                                            >
                                                <Trash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                            {filteredStickers.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={5} ta="center" py="xl">
                                        <Text size="sm" fw={600} c="dimmed" fs="italic">
                                            Geen stickers gevonden voor dit filter.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Paper>

            <Modal
                opened={Boolean(selectedImage)}
                onClose={() => setSelectedImage(null)}
                title="Sticker Foto"
                size="xl"
                centered
            >
                {selectedImage && (
                    <Box pos="relative" mih="50vh" w="100%">
                        <MediaAsset
                            asset={selectedImage}
                            alt="Sticker Full"
                            fill
                            objectFit="contain"
                        />
                    </Box>
                )}
            </Modal>
        </Stack>
    );
}

