import { Camera, Trash2 } from 'lucide-react';
import { ActionIcon, Box, Button, Center, FileButton, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface PhotoUploaderProps {
    imagePreview: string | null;
    onImageChange: (file: File | null) => void;
    onRemoveImage?: () => void;
}

export const PhotoUploader = ({
    imagePreview,
    onImageChange,
    onRemoveImage,
}: PhotoUploaderProps) => {
    return (
        <Box pos="relative">
            {imagePreview ? (
                <Box
                    pos="relative"
                    h={{ base: 192, sm: 224 }}
                    w="100%"
                    mod={{ 'photo-preview': true }}
                    style={{
                        overflow: 'hidden',
                        borderRadius: 'var(--mantine-radius-md)',
                        border: '1px solid var(--mantine-color-default-border)',
                    }}
                >
                    <MediaAsset asset={imagePreview} className="object-cover" alt="Preview" fill />
                    <Center
                        pos="absolute"
                        inset={0}
                        p="md"
                        mod={{ 'photo-overlay': true }}
                        style={{ backgroundColor: 'var(--overlay-scrim)' }}
                    >
                        <Group gap="sm">
                            <FileButton onChange={onImageChange} accept="image/*">
                                {(props) => (
                                    <Button
                                        {...props}
                                        type="button"
                                        size="sm"
                                        leftSection={<Camera size={16} />}
                                    >
                                        Wijzigen
                                    </Button>
                                )}
                            </FileButton>
                            <ActionIcon
                                type="button"
                                color="error"
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
                <FileButton onChange={onImageChange} accept="image/*">
                    {(props) => (
                        <UnstyledButton {...props} type="button" w="100%" display="block">
                            <Paper
                                h={160}
                                w="100%"
                                bg="var(--mantine-color-body)"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: '2px dashed var(--mantine-color-default-border)',
                                }}
                            >
                                <Stack align="center" gap="xs">
                                    <Text span c="dimmed" lh={1}>
                                        <Camera size={32} />
                                    </Text>
                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                                        Foto Selecteren
                                    </Text>
                                </Stack>
                            </Paper>
                        </UnstyledButton>
                    )}
                </FileButton>
            )}
        </Box>
    );
};
