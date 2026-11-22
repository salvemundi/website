'use client';

import { FileText, CreditCard, Bus, AlertCircle } from 'lucide-react';
import {
    Box,
    Card,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import type { TripSignup } from '@salvemundi/validations';
import { parseBoolean } from '@salvemundi/validations';
import { toISODate, formatShortDate } from '@/lib/utils/date-utils';
import {
    Input,
    Select,
    Textarea,
    Checkbox,
    DateAndLabel,
    PhoneAndLabel,
} from './ReisSignupFormFields';

interface StandardSignupFormProps {
    signup: TripSignup;
    initialData?: Partial<TripSignup>;
    isBusTrip?: boolean;
    minimal?: boolean;
    section?: 'all' | 'personal' | 'admin' | 'personal_basic' | 'personal_extended';
    compact?: boolean;
}

export default function StandardSignupForm({
    signup,
    initialData,
    isBusTrip,
    minimal = false,
    section = 'all',
    compact = true,
}: StandardSignupFormProps) {
    const content = (
        <Stack gap={compact ? 'lg' : 'xl'}>
            {(section === 'all' ||
                section === 'personal' ||
                section === 'personal_basic' ||
                section === 'personal_extended') && (
                <Box p={minimal ? 0 : 'xl'}>
                    <Group gap="md" mb={compact ? 'md' : 'xl'}>
                        <ThemeIcon size={40}>
                            <FileText size={20} />
                        </ThemeIcon>
                        <Box>
                            <Title order={2} size={compact ? 'h4' : 'h3'}>
                                Persoonsgegevens
                            </Title>
                            <Text size="xs" c="dimmed">
                                Basis informatie over de reiziger
                            </Text>
                        </Box>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={compact ? 'md' : 'lg'}>
                        {(section === 'all' ||
                            section === 'personal' ||
                            section === 'personal_basic') && (
                            <>
                                <Input
                                    label="Voornaam"
                                    name="first_name"
                                    defaultValue={initialData?.first_name || signup.first_name}
                                    required
                                    placeholder="Bijv. Jan"
                                />
                                <Input
                                    label="Achternaam"
                                    name="last_name"
                                    defaultValue={initialData?.last_name || signup.last_name}
                                    required
                                    placeholder="Bijv. de Vries"
                                />
                                <Box style={{ gridColumn: '1 / -1' }}>
                                    <Input
                                        label="Email Adres"
                                        name="email"
                                        type="email"
                                        defaultValue={initialData?.email || signup.email}
                                        required
                                        placeholder="jan@voorbeeld.nl"
                                    />
                                </Box>
                                <PhoneAndLabel
                                    label="Telefoonnummer"
                                    name="phone_number"
                                    defaultValue={
                                        initialData?.phone_number || signup.phone_number || ''
                                    }
                                />
                                <DateAndLabel
                                    label="Geboortedatum"
                                    name="date_of_birth"
                                    defaultValue={
                                        initialData?.date_of_birth ||
                                        (signup.date_of_birth ? toISODate(signup.date_of_birth) : '')
                                    }
                                />
                            </>
                        )}
                        {(section === 'all' ||
                            section === 'personal' ||
                            section === 'personal_extended') &&
                            !isBusTrip && (
                                <>
                                    <Select
                                        label="Type ID Bewijs"
                                        name="id_document"
                                        defaultValue={
                                            initialData?.id_document || signup.id_document || ''
                                        }
                                    >
                                        <option value="">Niet opgegeven</option>
                                        <option value="passport">Paspoort</option>
                                        <option value="id_card">Identiteitskaart (ID)</option>
                                    </Select>
                                    <Input
                                        label="Document Nummer"
                                        name="document_number"
                                        defaultValue={
                                            initialData?.document_number ||
                                            signup.document_number ||
                                            ''
                                        }
                                        placeholder="ID of Paspoort nr"
                                    />
                                </>
                            )}
                    </SimpleGrid>

                    {(section === 'all' ||
                        section === 'personal' ||
                        section === 'personal_extended') && (
                        <>
                            <SimpleGrid
                                cols={{ base: 1, md: 2 }}
                                spacing={compact ? 'md' : 'lg'}
                                mt={compact ? 'md' : 'lg'}
                            >
                                <Textarea
                                    label="Allergieën / Dieet"
                                    name="allergies"
                                    defaultValue={initialData?.allergies || signup.allergies || ''}
                                    placeholder="Lijst hier allergieën..."
                                />
                                <Textarea
                                    label="Bijzonderheden"
                                    name="special_notes"
                                    defaultValue={
                                        initialData?.special_notes || signup.special_notes || ''
                                    }
                                    placeholder="Andere belangrijke informatie..."
                                />
                            </SimpleGrid>

                            {!isBusTrip && (
                                <SimpleGrid
                                    cols={{ base: 1, md: 2 }}
                                    spacing={compact ? 'md' : 'lg'}
                                    mt={compact ? 'md' : 'lg'}
                                >
                                    <DateAndLabel
                                        label="Vervaldatum Document"
                                        name="document_expiry_date"
                                        defaultValue={
                                            initialData?.document_expiry_date ||
                                            (signup.document_expiry_date
                                                ? toISODate(signup.document_expiry_date)
                                                : '')
                                        }
                                    />
                                    <Group align="flex-end" pb={6}>
                                        <Checkbox
                                            label="Extra Koffer"
                                            name="extra_luggage"
                                            defaultChecked={
                                                initialData
                                                    ? parseBoolean(initialData.extra_luggage)
                                                    : parseBoolean(signup.extra_luggage)
                                            }
                                        />
                                    </Group>
                                </SimpleGrid>
                            )}

                            <Box mt={compact ? 'md' : 'lg'}>
                                {isBusTrip ? (
                                    <Checkbox
                                        label="Beschikbaar als chauffeur"
                                        name="willing_to_drive"
                                        defaultChecked={
                                            initialData
                                                ? parseBoolean(initialData.willing_to_drive)
                                                : parseBoolean(signup.willing_to_drive)
                                        }
                                    />
                                ) : (
                                    <Paper withBorder px="sm" py="xs">
                                        <Group gap="xs">
                                            <Text span c="brand" lh={1}>
                                                <Bus size={16} />
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Geen chauffeur informatie nodig voor vliegreizen
                                            </Text>
                                        </Group>
                                    </Paper>
                                )}
                            </Box>
                        </>
                    )}
                </Box>
            )}

            {!minimal && section === 'all' && <Divider />}

            {(section === 'all' || section === 'admin') && (
                <Box p={minimal ? 0 : 'xl'}>
                    {minimal && section === 'all' && <Divider mb={compact ? 'md' : 'lg'} />}
                    <Group gap="md" mb={compact ? 'md' : 'xl'}>
                        <ThemeIcon size={40}>
                            <CreditCard size={20} />
                        </ThemeIcon>
                        <Box>
                            <Title order={2} size={compact ? 'h4' : 'h3'}>
                                Beheer & Betaling
                            </Title>
                            <Text size="xs" c="dimmed">
                                Status en administratieve afhandeling
                            </Text>
                        </Box>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={compact ? 'md' : 'xl'}>
                        <Stack gap={compact ? 'md' : 'lg'}>
                            <Select
                                label="Registratie Status"
                                name="status"
                                defaultValue={initialData?.status || signup.status}
                            >
                                <option value="registered">Geregistreerd (Nieuw)</option>
                                <option value="confirmed">Bevestigd (Gaat mee)</option>
                                <option value="waitlist">Wachtlijst</option>
                                <option value="cancelled">Geannuleerd</option>
                            </Select>
                            <Select
                                label="Deelnemer Rol"
                                name="role"
                                defaultValue={initialData?.role || signup.role}
                            >
                                <option value="participant">Reguliere Reiziger</option>
                                <option value="crew">Crew / Organisatie</option>
                            </Select>
                        </Stack>

                        <Stack gap={compact ? 'md' : 'lg'}>
                            <Paper withBorder p={compact ? 'md' : 'lg'}>
                                <Stack gap="md">
                                    <Group justify="space-between" gap="md">
                                        <Checkbox
                                            label="Aanbetaling OK"
                                            name="deposit_paid"
                                            defaultChecked={
                                                initialData
                                                    ? parseBoolean(initialData.deposit_paid)
                                                    : parseBoolean(signup.deposit_paid)
                                            }
                                        />
                                        {signup.deposit_paid_at && (
                                            <Text size="xs" c="dimmed">
                                                {formatShortDate(new Date(signup.deposit_paid_at))}
                                            </Text>
                                        )}
                                    </Group>
                                    <Group justify="space-between" gap="md">
                                        <Checkbox
                                            label="Restbetaling OK"
                                            name="full_payment_paid"
                                            defaultChecked={
                                                initialData
                                                    ? parseBoolean(initialData.full_payment_paid)
                                                    : parseBoolean(signup.full_payment_paid)
                                            }
                                        />
                                        {signup.full_payment_paid_at && (
                                            <Text size="xs" c="dimmed">
                                                {formatShortDate(
                                                    new Date(signup.full_payment_paid_at)
                                                )}
                                            </Text>
                                        )}
                                    </Group>
                                </Stack>
                            </Paper>

                            <Group gap="xs" wrap="nowrap">
                                <Text span c="brand" lh={1}>
                                    <AlertCircle size={14} />
                                </Text>
                                <Text size="xs" c="dimmed" fs="italic">
                                    Betalingsstatus updates triggeren geen e-mails.
                                </Text>
                            </Group>
                        </Stack>
                    </SimpleGrid>
                </Box>
            )}
        </Stack>
    );

    if (minimal) {
        return content;
    }

    return (
        <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            {content}
        </Card>
    );
}
