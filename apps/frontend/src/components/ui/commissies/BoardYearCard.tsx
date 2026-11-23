import Image from 'next/image';
import { User, Medal } from 'lucide-react';
import {
    Badge,
    Box,
    Card,
    Grid,
    GridCol,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { type Board } from '@salvemundi/validations/schema/board.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface BoardYearCardProps {
    board: Board;
}

export const BoardYearCard = ({ board }: BoardYearCardProps) => {
    return (
        <Card component="section" padding="xl">
            <Grid gap="xl" align="flex-start">
                <GridCol span={{ base: 12, lg: 5 }}>
                    <Box
                        pos="relative"
                        w="100%"
                        style={{
                            aspectRatio: '4 / 3',
                            overflow: 'hidden',
                            borderRadius: 'var(--mantine-radius-md)',
                            boxShadow: 'var(--mantine-shadow-md)',
                        }}
                    >
                        {!board.image ? (
                            <Box pos="relative" w="100%" h="100%" p="lg" style={{ opacity: 0.4 }}>
                                <FallbackLogo
                                    alt={board.naam || 'Bestuur'}
                                    className="object-contain"
                                />
                            </Box>
                        ) : (
                            <Image
                                src={getImageUrl(board.image)}
                                alt={board.naam || 'Bestuur'}
                                fill
                                className="object-cover"
                            />
                        )}
                    </Box>
                </GridCol>

                <GridCol span={{ base: 12, lg: 7 }}>
                    <Stack gap="lg">
                        <Stack gap="xs">
                            <Badge size="md" w="fit-content">
                                {board.year}
                            </Badge>
                            <Title order={2} c="brand">
                                {board.naam}
                            </Title>
                        </Stack>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            {board.members?.map((member, idx) => {
                                const name = member.name || (member.user_id ? `${member.user_id.first_name} ${member.user_id.last_name}` : 'Onbekend');
                                const isLeader = member.functie?.toLowerCase().includes('voorzitter');

                                return (
                                    <Paper key={idx} p="sm" bg="var(--mantine-color-body)">
                                        <Group gap="sm" wrap="nowrap">
                                            {member.user_id?.avatar ? (
                                                <Box
                                                    pos="relative"
                                                    w={40}
                                                    h={40}
                                                    style={{
                                                        flexShrink: 0,
                                                        overflow: 'hidden',
                                                        borderRadius: '9999px',
                                                    }}
                                                >
                                                    <Image
                                                        src={getImageUrl(member.user_id.avatar)}
                                                        alt={name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </Box>
                                            ) : (
                                                <ThemeIcon size="lg">
                                                    {isLeader ? <Medal size={16} /> : <User size={16} />}
                                                </ThemeIcon>
                                            )}
                                            <Stack gap={2} miw={0} flex={1}>
                                                <Text size="sm" fw={700} truncate>
                                                    {name}
                                                </Text>
                                                <Text size="xs" fw={700} c="brand" opacity={0.85}>
                                                    {member.functie || 'Bestuurslid'}
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </SimpleGrid>
                    </Stack>
                </GridCol>
            </Grid>
        </Card>
    );
};
