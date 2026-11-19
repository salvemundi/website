import { Camera, Trash2 } from 'lucide-react';
import { ActionIcon, Box, Button, Center, Group, Paper, Stack, Text } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface PhotoUploaderProps {
    imagePreview: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage?: () => void;
}

export const PhotoUploader = ({
    imagePreview,
    onImageChange,
    onRemoveImage,
}: PhotoUploaderProps) => {
    return (
        <Box pos="relative">
            <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
                id="photo-upload"
            />
            {imagePreview ? (
                <Box
                    pos="relative"
                    h={{ base: 192, sm: 224 }}
                    w="100%"
                    mod={{ 'photo-preview': true }}
                    style={{
                        overflow: 'hidden',
                        borderRadius: 'var(--mantine-radius-lg)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <MediaAsset asset={imagePreview} className="size-full object-cover" alt="Preview" fill />
                    <Center
                        pos="absolute"
                        inset={0}
                        p="md"
                        mod={{ 'photo-overlay': true }}
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                    >
                        <Group gap="sm">
                            <Button
                                component="label"
                                htmlFor="photo-upload"
                                size="sm"
                                variant="default"
                                leftSection={<Camera size={16} />}
                            >
                                Wijzigen
                            </Button>
                            <ActionIcon
                                type="button"
                                color="error"
                                variant="filled"
                                size="lg"
                                onClick={onRemoveImage}
                                aria-label="Foto verwijderen"
                            >
                                <Trash2 size={16} />
                            </ActionIcon>
                        </Group>
                    </Center>
                </Box>
            ) : (
                <Paper
                    component="label"
                    htmlFor="photo-upload"
                    h={160}
                    w="100%"
                    radius="lg"
                    bg="var(--mantine-color-body)"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '2px dashed var(--border)',
                    }}
                >
                    <Stack align="center" gap="xs">
                        <Text span c="dimmed" lh={1}>
                            <Camera size={32} />
                        </Text>
                        <Text size="xs" fw={900} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                            Foto Selecteren
                        </Text>
                    </Stack>
                </Paper>
            )}
        </Box>
    );
};
