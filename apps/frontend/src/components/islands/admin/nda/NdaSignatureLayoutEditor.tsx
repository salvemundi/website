'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, RotateCcw, Save, Pencil } from 'lucide-react';
import type { NdaSignatureLayout } from '@salvemundi/validations';
import { saveNdaSignatureLayout } from '@/server/actions/admin/nda/admin-nda-templates.actions';
import { Button } from '@/components/islands/admin/intro/IntroTabComponents';

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

    const [boxes, setBoxes] = useState<Partial<Record<StepKey, PixelBox>>>({});
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
                    setBoxes({
                        location: toBox(initialLayout.location),
                        date: toBox(initialLayout.date),
                        name: toBox(initialLayout.name),
                        signature: {
                            x0: initialLayout.signature.x * scale,
                            x1: (initialLayout.signature.x + initialLayout.signature.width) * scale,
                            y0: (baseViewport.height - (initialLayout.signature.y + initialLayout.signature.height)) * scale,
                            y1: (baseViewport.height - initialLayout.signature.y) * scale,
                        },
                    });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentFileId]);

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
        setBoxes((prev) => ({ ...prev, [activeStep]: drawing }));
        setDrawing(null);

        const currentIndex = STEPS.findIndex((s) => s.key === activeStep);
        const nextStep = currentIndex >= 0 ? STEPS.at(currentIndex + 1) : undefined;
        setActiveStep(nextStep?.key ?? null);
    }, [activeStep, drawing]);

    const allBoxesSet = STEPS.every((s) => boxes[s.key]);

    const handleSave = async () => {
        if (!pageWidthPt || !pageHeightPt || !renderScale || !allBoxesSet) return;
        setSaving(true);
        setSaveError(null);

        const toTextField = (box: PixelBox) => ({
            x: Math.min(box.x0, box.x1) / renderScale,
            y: pageHeightPt - Math.max(box.y0, box.y1) / renderScale,
            maxWidth: Math.abs(box.x1 - box.x0) / renderScale,
        });
        const signatureBox = boxes.signature;
        if (!boxes.location || !boxes.date || !boxes.name || !signatureBox) return;

        const layout: NdaSignatureLayout = {
            pageWidth: pageWidthPt,
            pageHeight: pageHeightPt,
            location: toTextField(boxes.location),
            date: toTextField(boxes.date),
            name: toTextField(boxes.name),
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
        setBoxes({});
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
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {STEPS.map((step) => {
                    const done = Boolean(boxes[step.key]);
                    const active = activeStep === step.key;
                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={() => setActiveStep(step.key)}
                            className={`btn-nda-layout-step inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                                active
                                    ? 'bg-(--beheer-accent) text-white border-(--beheer-accent)'
                                    : done
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-(--beheer-card-soft) text-(--beheer-text-muted) border-(--beheer-border)'
                            }`}
                        >
                            {done && !active ? <Pencil className="h-3 w-3" /> : null}
                            {step.label}
                        </button>
                    );
                })}
            </div>

            {activeStep && (
                <p className="text-xs text-(--beheer-text-muted)">
                    {STEPS.find((s) => s.key === activeStep)?.instruction}
                </p>
            )}

            {loadError && <p className="text-xs font-semibold text-red-500">{loadError}</p>}
            {saveError && <p className="text-xs font-semibold text-red-500">{saveError}</p>}

            <div ref={containerRef} className="relative w-full max-w-2xl border border-(--beheer-border) rounded-xl overflow-hidden bg-white">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-(--beheer-accent)" />
                    </div>
                )}
                <canvas ref={canvasRef} className="block w-full h-auto" />
                <div
                    className={`absolute inset-0 ${activeStep ? 'cursor-crosshair' : ''}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    {STEPS.map((step) => {
                        const box = boxes[step.key];
                        if (!box) return null;
                        const style = boxStyle(box);
                        return (
                            <div
                                key={step.key}
                                className="absolute border-2 border-(--beheer-accent) bg-(--beheer-accent)/15 pointer-events-none flex items-start"
                                style={{ left: style.left, top: style.top, width: style.width, height: style.height }}
                            >
                                <span className="text-[10px] font-semibold text-(--beheer-accent) bg-white/90 px-1 rounded-sm">{step.label}</span>
                            </div>
                        );
                    })}
                    {drawing && (
                        <div
                            className="absolute border-2 border-dashed border-(--beheer-accent) bg-(--beheer-accent)/10 pointer-events-none"
                            style={{
                                left: Math.min(drawing.x0, drawing.x1),
                                top: Math.min(drawing.y0, drawing.y1),
                                width: Math.abs(drawing.x1 - drawing.x0),
                                height: Math.abs(drawing.y1 - drawing.y0),
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button onClick={() => { void handleSave(); }} disabled={!allBoxesSet} loading={saving} icon={Save}>
                    Handtekeningplek opslaan
                </Button>
                <Button onClick={handleReset} variant="ghost" icon={RotateCcw}>
                    Opnieuw beginnen
                </Button>
            </div>
        </div>
    );
}
