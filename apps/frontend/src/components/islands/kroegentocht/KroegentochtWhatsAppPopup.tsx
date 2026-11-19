'use client';

import React, { useEffect, useState } from 'react';
import { getKroegentochtWhatsAppLink } from '@/server/actions/events/kroegentocht/kroegentocht-public.actions';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Button, Modal, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface KroegentochtWhatsAppPopupProps {
    signupId?: number;
    token?: string;
}

export function KroegentochtWhatsAppPopup({ signupId, token }: KroegentochtWhatsAppPopupProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [communityUrl, setCommunityUrl] = useState<string | null>(null);

    useEffect(() => {
        async function checkEligibility() {
            const response = await getKroegentochtWhatsAppLink(signupId, token);
            if (response.success && response.url) {
                setCommunityUrl(response.url);
                setIsOpen(true);
            }
        }
        void checkEligibility();
    }, [signupId, token]);

    if (!isOpen || !communityUrl) return null;

    return (
        <Modal
            opened={isOpen}
            onClose={() => setIsOpen(false)}
            centered
            radius="xl"
            size="sm"
            withCloseButton
            aria-label="Join de WhatsApp Community"
        >
            <Stack gap="md">
                <ThemeIcon size={48} radius="md" variant="light" color="brand">
                    <MessageCircle size={24} />
                </ThemeIcon>

                <Stack gap="xs">
                    <Title order={3} size="h4">
                        Join de WhatsApp Community!
                    </Title>
                    <Text size="sm" c="dimmed">
                        Je betaling is succesvol ontvangen! Voeg jezelf direct toe aan de officiële Salve Mundi Kroegentocht community om op de hoogte te blijven van routes, tijden en groepsindelingen.
                    </Text>
                </Stack>

                <Button
                    component="a"
                    href={communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    size="md"
                    rightSection={<ArrowRight size={16} />}
                >
                    Deelnemen aan community
                </Button>
            </Stack>
        </Modal>
    );
}
