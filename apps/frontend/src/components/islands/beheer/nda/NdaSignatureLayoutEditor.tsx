'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Save, Pencil } from 'lucide-react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Center,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
} from '@mantine/core';
import type { NdaSignatureLayout } from '@salvemundi/validations';
import { saveNdaSignatureLayout } from '@/server/actions/beheer/nda/beheer-nda-templates.actions';

interface Props {
    templateId: number;
    documentFileId: string;
    initialLayout: NdaSignatureLayout | null;
    onSaved: () => void;
}

type StepKey = 'location' | 'date' | 'name' | 'signature';

const STEPS: { key: StepKey; label: string; instruction: string }[] = [
    { key: 'location', label: 'Locatie', instruction: 'Teken een vak over de lege plek na "TE ___" (de plaatsnaam).' },
    { key: 'date', label: 'Datum', instruction: 'Teken een vak over de lege plek na "OP ___" (de datum).' },
    { key: 'name', label: 'Naam commissielid', instruction: 'Teken een vak op de plek waar de naam van het commissielid moet komen (naast Voorzitter/Secretaris).' },
    { key: 'signature', label: 'Handtekening commissielid', instruction: 'Teken een vak op de plek waar de handtekening van het commissielid moet komen.' },
];

interface PixelBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

const TEXT_BOX_PREVIEW_HEIGHT_PT = 14;

export default function NdaSignatureLayoutEditor({ templateId, documentFileId, initialLayout, onSaved }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [pageWidthPt, setPageWidthPt] = useState<number | null>(null);
    const [pageHeightPt, setPageHeightPt] = useState<number | null>(null);
    const [renderScale, setRenderScale] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [boxes, setBoxes] = useState<Map<StepKey, PixelBox>>(() => new Map());
    const [activeStep, setActiveStep] = useState<StepKey | null>(null);
    const [drawing, setDrawing] = useState<PixelBox | null>(null);
    const dragStart = useRef<{ x: number; y: number } | null>(null);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function render() {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

                const loadingTask = pdfjsLib.getDocument({ url: `/api/assets/${documentFileId}` });
                const doc = await loadingTask.promise;
                const page = await doc.getPage(doc.numPages);
                const baseViewport = page.getViewport({ scale: 1 });

                const containerWidth = containerRef.current?.clientWidth ?? 600;
                const scale = Math.min(containerWidth / baseViewport.width, 1.6);
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas || cancelled) return;
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvas, viewport }).promise;

                setPageWidthPt(baseViewport.width);
                setPageHeightPt(baseViewport.height);
                setRenderScale(scale);

                if (initialLayout) {
                    const toBox = (field: { x: number; y: number; maxWidth: number }): PixelBox => ({
                        x0: field.x * scale,
                        x1: (field.x + field.maxWidth) * scale,
                        y0: (baseViewport.height - (field.y + TEXT_BOX_PREVIEW_HEIGHT_PT)) * scale,
                        y1: (baseViewport.height - field.y) * scale,
                    });
                    setBoxes(
                        new Map<StepKey, PixelBox>([
                            ['location', toBox(initialLayout.location)],
                            ['date', toBox(initialLayout.date)],
                            ['name', toBox(initialLayout.name)],
                            [
                                'signature',
                                {
                                    x0: initialLayout.signature.x * scale,
                                    x1: (initialLayout.signature.x + initialLayout.signature.width) * scale,
                                    y0: (baseViewport.height - (initialLayout.signature.y + initialLayout.signature.height)) * scale,
                                    y1: (baseViewport.height - initialLayout.signature.y) * scale,
                                },
                            ],
                        ])
                    );
                } else {
                    setActiveStep('location');
                }
            } catch {
                if (!cancelled) setLoadError('Kon het PDF-document niet laden om de handtekeningplek in te stellen.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void render();
        return () => { cancelled = true; };
    }, [documentFileId, initialLayout]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!activeStep) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        dragStart.current = { x, y };
        setDrawing({ x0: x, y0: y, x1: x, y1: y });
    }, [activeStep]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!activeStep || !dragStart.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDrawing({ x0: dragStart.current.x, y0: dragStart.current.y, x1: x, y1: y });
    }, [activeStep]);

    const handlePointerUp = useCallback(() => {
        if (!activeStep || !dragStart.current || !drawing) return;
        dragStart.current = null;
        if (Math.abs(drawing.x1 - drawing.x0) < 6 || Math.abs(drawing.y1 - drawing.y0) < 6) {
            setDrawing(null);
            return;
        }
        setBoxes((prev) => new Map(prev).set(activeStep, drawing));
        setDrawing(null);

        const currentIndex = STEPS.findIndex((s) => s.key === activeStep);
        const nextStep = currentIndex >= 0 ? STEPS.at(currentIndex + 1) : undefined;
        setActiveStep(nextStep?.key ?? null);
    }, [activeStep, drawing]);

    const allBoxesSet = STEPS.every((s) => boxes.has(s.key));

    const handleSave = async () => {
        if (!pageWidthPt || !pageHeightPt || !renderScale || !allBoxesSet) return;
        setSaving(true);
        setSaveError(null);

        const toTextField = (box: PixelBox) => ({
            x: Math.min(box.x0, box.x1) / renderScale,
            y: pageHeightPt - Math.max(box.y0, box.y1) / renderScale,
            maxWidth: Math.abs(box.x1 - box.x0) / renderScale,
        });
        const locationBox = boxes.get('location');
        const dateBox = boxes.get('date');
        const nameBox = boxes.get('name');
        const signatureBox = boxes.get('signature');
        if (!locationBox || !dateBox || !nameBox || !signatureBox) return;

        const layout: NdaSignatureLayout = {
            pageWidth: pageWidthPt,
            pageHeight: pageHeightPt,
            location: toTextField(locationBox),
            date: toTextField(dateBox),
            name: toTextField(nameBox),
            signature: {
                x: Math.min(signatureBox.x0, signatureBox.x1) / renderScale,
                y: pageHeightPt - Math.max(signatureBox.y0, signatureBox.y1) / renderScale,
                width: Math.abs(signatureBox.x1 - signatureBox.x0) / renderScale,
                height: Math.abs(signatureBox.y1 - signatureBox.y0) / renderScale,
            },
        };

        const result = await saveNdaSignatureLayout(templateId, layout);
        setSaving(false);
        if (!result.success) {
            setSaveError(result.error);
            return;
        }
        onSaved();
    };

    const handleReset = () => {
        setBoxes(new Map());
        setActiveStep('location');
        setSaveError(null);
    };

    const boxStyle = (box: PixelBox) => ({
        left: Math.min(box.x0, box.x1),
        top: Math.min(box.y0, box.y1),
        width: Math.abs(box.x1 - box.x0),
        height: Math.abs(box.y1 - box.y0),
    });

    return (
        <Stack gap="md">
            <Group gap="xs" wrap="wrap">
                {STEPS.map((step) => {
                    const done = boxes.has(step.key);
                    const active = activeStep === step.key;
                    return (
                        <Button
                            key={step.key}
                            type="button"
                            size="xs"
                            variant={active ? 'filled' : done ? 'light' : 'default'}
                            color={active ? 'brand' : done ? 'success' : undefined}
                            onClick={() => setActiveStep(step.key)}
                            leftSection={done && !active ? <Pencil size={12} /> : undefined}
                        >
                            {step.label}
                        </Button>
                    );
                })}
            </Group>

            {activeStep && (
                <Text size="xs" c="dimmed">
                    {STEPS.find((s) => s.key === activeStep)?.instruction}
                </Text>
            )}

            {loadError && <Alert color="error" variant="light">{loadError}</Alert>}
            {saveError && <Alert color="error" variant="light">{saveError}</Alert>}

            <Paper
                ref={containerRef}
                withBorder
                radius="md"
                pos="relative"
                w="100%"
                maw={672}
                bg="white"
                style={{ overflow: 'hidden' }}
            >
                {loading && (
                    <Center py={80}>
                        <Loader size="md" color="brand" />
                    </Center>
                )}
                <canvas ref={canvasRef} style={{ display: 'block', height: 'auto', width: '100%' }} />
                <Box
                    pos="absolute"
                    inset={0}
                    style={{ cursor: activeStep ? 'crosshair' : undefined }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    {STEPS.map((step) => {
                        const box = boxes.get(step.key);
                        if (!box) return null;
                        const style = boxStyle(box);
                        return (
                            <Box
                                key={step.key}
                                pos="absolute"
                                style={{
                                    pointerEvents: 'none',
                                    border: '2px solid var(--primary)',
                                    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    left: style.left,
                                    top: style.top,
                                    width: style.width,
                                    height: style.height,
                                }}
                            >
                                <Badge size="xs" radius="xs" variant="filled" color="brand">
                                    {step.label}
                                </Badge>
                            </Box>
                        );
                    })}
                    {drawing && (
                        <Box
                            pos="absolute"
                            style={{
                                pointerEvents: 'none',
                                border: '2px dashed var(--primary)',
                                backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                                left: Math.min(drawing.x0, drawing.x1),
                                top: Math.min(drawing.y0, drawing.y1),
                                width: Math.abs(drawing.x1 - drawing.x0),
                                height: Math.abs(drawing.y1 - drawing.y0),
                            }}
                        />
                    )}
                </Box>
            </Paper>

            <Group gap="sm">
                <Button
                    type="button"
                    onClick={() => { void handleSave(); }}
                    disabled={!allBoxesSet}
                    loading={saving}
                    leftSection={<Save size={16} />}
                >
                    Handtekeningplek opslaan
                </Button>
                <Button
                    type="button"
                    variant="subtle"
                    onClick={handleReset}
                    leftSection={<RotateCcw size={16} />}
                >
                    Opnieuw beginnen
                </Button>
            </Group>
        </Stack>
    );
}
