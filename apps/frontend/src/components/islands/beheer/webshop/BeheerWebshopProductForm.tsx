'use client';

import { useState } from 'react';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Plus,
    Save,
    Trash2,
    Upload,
} from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Divider,
    FileButton,
    Group,
    Input,
    Loader,
    NativeSelect,
    NumberInput,
    Paper,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Switch,
    Table,
    TagsInput,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { uploadWebshopMedia } from '@/server/actions/beheer/webshop/beheer-webshop-products.actions';
import { safeConsoleError } from '@/server/utils/logger';
import {
    parseCustomFieldDefs,
    type AdminDropWindow,
    type AdminProduct,
} from './webshop-admin-types';

interface Props {
    product?: AdminProduct | null;
    dropWindows: AdminDropWindow[];
    onSave: (formData: FormData) => void;
    onCancel: () => void;
    isPending: boolean;
    error: string | null;
}

interface MediaDraft {
    asset: string;
    assetType?: string;
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function BeheerWebshopProductForm({
    product,
    dropWindows,
    onSave,
    onCancel,
    isPending,
    error,
}: Props) {
    const [name, setName] = useState(product?.name || '');
    const [slug, setSlug] = useState(product?.slug || '');
    const [slugTouched, setSlugTouched] = useState(!!product);
    const [type, setType] = useState<'item' | 'clothing'>(
        product?.type === 'clothing' ? 'clothing' : 'item'
    );

    const [sizes, setSizes] = useState<string[]>(() =>
        Array.from(
            new Set((product?.variants || []).map((v) => v.size).filter((v): v is string => !!v))
        )
    );
    const [colors, setColors] = useState<string[]>(() =>
        Array.from(
            new Set((product?.variants || []).map((v) => v.color).filter((v): v is string => !!v))
        )
    );

    // Per size/color stock, keyed by "size|color". Empty string = unlimited.
    const [variantStock, setVariantStock] = useState<Map<string, string>>(
        () =>
            new Map(
                (product?.variants || []).map((v) => [
                    `${v.size ?? ''}|${v.color ?? ''}`,
                    v.stock_quantity === null || v.stock_quantity === undefined ? '' : String(v.stock_quantity),
                ])
            )
    );
    const stockFor = (size: string, color: string | null) => variantStock.get(`${size}|${color ?? ''}`) ?? '';
    const setStockFor = (size: string, color: string | null, value: string) =>
        setVariantStock((prev) => new Map(prev).set(`${size}|${color ?? ''}`, value));

    const [customFields, setCustomFields] = useState<{ label: string; max_length: number }[]>(() =>
        parseCustomFieldDefs(product?.custom_fields)
    );

    const updateCustomField = (
        index: number,
        patch: Partial<{ label: string; max_length: number }>
    ) => setCustomFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));

    const [media, setMedia] = useState<MediaDraft[]>(
        product?.media.map((m) => ({ asset: m.asset })) || []
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slugTouched) setSlug(slugify(value));
    };

    const moveMedia = (from: number, to: number) => {
        if (to < 0 || to >= media.length) return;
        setMedia((prev) => {
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
    };

    const handleUpload = async (file: File | null) => {
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await uploadWebshopMedia(fd);
            if (res.success && res.assetId) {
                setMedia((prev) => [
                    ...prev,
                    { asset: res.assetId as string, assetType: res.assetType },
                ]);
            } else {
                setUploadError(res.error || 'Uploaden mislukt.');
            }
        } catch (err) {
            safeConsoleError('[BeheerWebshopProductForm.tsx][handleUpload]', err);
            setUploadError('Uploaden mislukt.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (product) fd.set('id', String(product.id));
        fd.set('type', type);
        fd.set('slug', slug);

        // Every size is available in every color — generate the full combo list instead of
        // making the admin type each size/color pair by hand.
        const variants =
            type === 'clothing'
                ? colors.length > 0
                    ? sizes.flatMap((size) =>
                          colors.map((color) => ({ size, color, sku: null, is_active: true, stock_quantity: stockFor(size, color) || null }))
                      )
                    : sizes.map((size) => ({ size, color: null, sku: null, is_active: true, stock_quantity: stockFor(size, null) || null }))
                : [];
        fd.set('variants_json', JSON.stringify(variants));
        fd.set('media_json', JSON.stringify(media));
        fd.set('custom_fields_json', JSON.stringify(customFields));
        onSave(fd);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                {error && (
                    <Alert color="error" variant="light" icon={<AlertCircle size={16} />}>
                        {error}
                    </Alert>
                )}

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <TextInput
                        name="name"
                        label="Naam"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Bijv. Salve Mundi Hoodie"
                    />

                    <TextInput
                        label="Slug"
                        required
                        value={slug}
                        onChange={(e) => {
                            setSlugTouched(true);
                            setSlug(slugify(e.target.value));
                        }}
                        placeholder="salve-mundi-hoodie"
                        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
                    />

                    <Input.Wrapper label="Type">
                        <SegmentedControl
                            fullWidth
                            mt={4}
                            value={type}
                            onChange={(val) => setType(val as 'item' | 'clothing')}
                            data={[
                                { value: 'item', label: 'Item' },
                                { value: 'clothing', label: 'Kleding' },
                            ]}
                        />
                    </Input.Wrapper>

                    <NativeSelect
                        name="drop_window_id"
                        label="Drop"
                        defaultValue={product?.drop_window_id ? String(product.drop_window_id) : ''}
                        data={[
                            { value: '', label: 'Geen drop (los item, direct te koop)' },
                            ...dropWindows.map((dw) => ({
                                value: String(dw.id),
                                label: `${dw.name ?? 'Onbekend'} (${dw.status ?? '-'})`,
                            })),
                        ]}
                    />

                    <NumberInput
                        name="price"
                        label="Prijs (€)"
                        required
                        min={0.01}
                        step={0.01}
                        decimalScale={2}
                        defaultValue={product?.price ? Number(product.price) : undefined}
                    />

                    <NumberInput
                        name="max_orders"
                        label="Limiet bestellingen (optioneel)"
                        min={1}
                        step={1}
                        allowDecimal={false}
                        placeholder="Geen limiet"
                        defaultValue={product?.max_orders ?? undefined}
                    />

                    <NumberInput
                        name="stock_quantity"
                        label="Totale voorraad (optioneel)"
                        min={0}
                        step={1}
                        allowDecimal={false}
                        placeholder="Onbeperkt"
                        defaultValue={product?.stock_quantity ?? undefined}
                    />
                </SimpleGrid>

                <Textarea
                    name="description"
                    label="Beschrijving"
                    rows={6}
                    autosize
                    minRows={4}
                    defaultValue={product?.description || ''}
                    styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
                />

                <Switch
                    id="is_active"
                    name="is_active"
                    label="Direct actief stellen (zichtbaar in catalogus)"
                    defaultChecked={product?.is_active ?? true}
                />

                <Divider />

                <Stack gap="xs">
                    <Text size="xs" fw={600} c="dimmed">
                        Foto&apos;s / video
                    </Text>
                    <Text size="xs" c="dimmed">
                        Gebruik de pijltjes om de volgorde te wijzigen. De eerste is de cover.
                    </Text>
                    <Group gap="sm" wrap="wrap">
                        {media.map((item, index) => (
                            <Paper
                                key={`${item.asset}-${index}`}
                                withBorder
                                radius="md"
                                pos="relative"
                                w={96}
                                h={96}
                                style={{ overflow: 'hidden' }}
                            >
                                <MediaAsset
                                    asset={item.asset}
                                    alt={`${name || 'Product'} afbeelding ${index + 1}`}
                                    fill
                                    sizes="96px"
                                    objectFit="cover"
                                />
                                {index === 0 && (
                                    <Badge
                                        size="xs"
                                        color="brand"
                                        variant="filled"
                                        pos="absolute"
                                        top={4}
                                        left={4}
                                    >
                                        Cover
                                    </Badge>
                                )}
                                <Group
                                    gap={2}
                                    justify="space-between"
                                    pos="absolute"
                                    bottom={4}
                                    left={4}
                                    right={4}
                                >
                                    <ActionIcon
                                        type="button"
                                        size="xs"
                                        variant="filled"
                                        color="darkSurface"
                                        onClick={() => moveMedia(index, index - 1)}
                                        disabled={index === 0}
                                        aria-label="Verplaats naar links"
                                    >
                                        <ChevronLeft size={12} />
                                    </ActionIcon>
                                    <ActionIcon
                                        type="button"
                                        size="xs"
                                        variant="filled"
                                        color="error"
                                        onClick={() =>
                                            setMedia((prev) => prev.filter((_, i) => i !== index))
                                        }
                                        aria-label="Verwijder media"
                                    >
                                        <Trash2 size={12} />
                                    </ActionIcon>
                                    <ActionIcon
                                        type="button"
                                        size="xs"
                                        variant="filled"
                                        color="darkSurface"
                                        onClick={() => moveMedia(index, index + 1)}
                                        disabled={index === media.length - 1}
                                        aria-label="Verplaats naar rechts"
                                    >
                                        <ChevronRight size={12} />
                                    </ActionIcon>
                                </Group>
                            </Paper>
                        ))}
                        <FileButton
                            onChange={(file) => {
                                void handleUpload(file);
                            }}
                            accept="image/*,video/*"
                            disabled={uploading}
                        >
                            {(props) => (
                                <Button
                                    {...props}
                                    type="button"
                                    variant="default"
                                    w={96}
                                    h={96}
                                    p={0}
                                    style={{ borderStyle: 'dashed' }}
                                    aria-label="Upload media"
                                >
                                    {uploading ? <Loader size="sm" /> : <Upload size={20} />}
                                </Button>
                            )}
                        </FileButton>
                    </Group>
                    {uploadError && (
                        <Alert color="error" variant="light">
                            {uploadError}
                        </Alert>
                    )}
                </Stack>

                <Divider />

                <Stack gap="md">
                    <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                        <Box flex={1} miw={220}>
                            <Text size="xs" fw={600} c="dimmed">
                                Extra invulvelden (optioneel)
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>
                                Velden die de klant bij het bestellen moet invullen, bijv. &quot;Naam op shirt&quot;. Je bepaalt zelf hoeveel velden, hun naam en het maximaal aantal tekens (max. 10 velden).
                            </Text>
                        </Box>
                        <Button
                            type="button"
                            variant="default"
                            size="xs"
                            onClick={() =>
                                setCustomFields((prev) => [...prev, { label: '', max_length: 50 }])
                            }
                            disabled={customFields.length >= 10}
                            leftSection={<Plus size={14} />}
                        >
                            Veld toevoegen
                        </Button>
                    </Group>
                    {customFields.map((field, index) => (
                        <Group key={index} align="flex-end" gap="sm" wrap="nowrap">
                            <TextInput
                                label={`Naam van veld ${index + 1}`}
                                value={field.label}
                                maxLength={100}
                                required
                                flex={1}
                                onChange={(e) =>
                                    updateCustomField(index, { label: e.target.value })
                                }
                                placeholder="Bijv. Naam op shirt"
                            />
                            <NumberInput
                                label="Max. tekens"
                                value={field.max_length}
                                min={1}
                                max={500}
                                required
                                allowDecimal={false}
                                w={110}
                                onChange={(val) =>
                                    updateCustomField(index, { max_length: Number(val) || 1 })
                                }
                            />
                            <ActionIcon
                                type="button"
                                variant="light"
                                color="error"
                                size="lg"
                                mb={2}
                                onClick={() =>
                                    setCustomFields((prev) => prev.filter((_, i) => i !== index))
                                }
                                aria-label={`Verwijder veld ${index + 1}`}
                            >
                                <Trash2 size={16} />
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>

                {type === 'clothing' && (
                    <>
                        <Divider />
                        <Stack gap="md">
                            <Text size="xs" c="dimmed">
                                Elke maat is in elke kleur verkrijgbaar — er wordt automatisch een variant aangemaakt voor elke combinatie.
                            </Text>
                            <TagsInput
                                label="Maten *"
                                placeholder="Typ een maat en druk op Enter (S, M, L...)"
                                value={sizes}
                                onChange={setSizes}
                            />
                            <TagsInput
                                label="Kleuren (optioneel)"
                                placeholder="Typ een kleur en druk op Enter"
                                value={colors}
                                onChange={setColors}
                            />
                            {sizes.length === 0 && (
                                <Text size="xs" c="dimmed" fs="italic">
                                    Voeg minimaal 1 maat toe.
                                </Text>
                            )}

                            {sizes.length > 0 && (
                                <Stack gap="xs">
                                    <Box>
                                        <Text size="sm" fw={500}>
                                            Voorraad per maat{colors.length > 0 ? ' en kleur' : ''}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Laat leeg voor onbeperkt, 0 = uitverkocht. De voorraad wordt automatisch verlaagd bij elke bestelling en teruggezet bij annuleren.
                                        </Text>
                                    </Box>
                                    <Table.ScrollContainer minWidth={240}>
                                        <Table withTableBorder verticalSpacing={4}>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Maat</Table.Th>
                                                    {(colors.length > 0 ? colors : ['Voorraad']).map((color) => (
                                                        <Table.Th key={color}>{color}</Table.Th>
                                                    ))}
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {sizes.map((size) => (
                                                    <Table.Tr key={size}>
                                                        <Table.Td fw={600}>{size}</Table.Td>
                                                        {(colors.length > 0 ? colors : [null]).map((color: string | null) => (
                                                            <Table.Td key={color ?? 'none'}>
                                                                <NumberInput
                                                                    size="xs"
                                                                    w={96}
                                                                    min={0}
                                                                    step={1}
                                                                    allowDecimal={false}
                                                                    allowNegative={false}
                                                                    placeholder="∞"
                                                                    value={stockFor(size, color)}
                                                                    onChange={(value) => setStockFor(size, color, String(value))}
                                                                    aria-label={`Voorraad ${[size, color].filter(Boolean).join(' / ')}`}
                                                                />
                                                            </Table.Td>
                                                        ))}
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Table.ScrollContainer>
                                </Stack>
                            )}
                        </Stack>
                    </>
                )}

                <Divider />

                <Group justify="flex-end" gap="sm">
                    <Button type="button" variant="default" onClick={onCancel}>
                        Annuleren
                    </Button>
                    <Button
                        type="submit"
                        loading={isPending}
                        leftSection={<Save size={16} />}
                    >
                        {isPending ? 'Bezig...' : product ? 'Opslaan' : 'Product Aanmaken'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
