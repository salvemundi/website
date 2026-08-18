'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2, Send } from 'lucide-react';
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/forms/SignaturePad';
import { signMyNda } from '@/server/actions/nda/member-nda.actions';
import { reverseGeocode } from '@/shared/lib/utils/geolocation';

interface Props {
    signatureId: number;
    committeeName: string;
    documentFileId: string;
}

export default function NdaSignIsland({ signatureId, committeeName, documentFileId }: Props) {
    const router = useRouter();
    const signaturePadRef = useRef<SignaturePadHandle>(null);

    const [city, setCity] = useState('');
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleUseLocation = () => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- DOM lib types navigator.geolocation as always present, but older/restricted browsers can omit it at runtime
        if (!navigator.geolocation) {
            setLocationError('Locatiebepaling wordt niet ondersteund door je browser. Vul de stad handmatig in.');
            return;
        }
        setLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                void reverseGeocode(position.coords.latitude, position.coords.longitude).then((result) => {
                    setLocating(false);
                    if (result.city) {
                        setCity(result.city);
                    } else {
                        setLocationError('Kon geen stad bepalen. Vul deze handmatig in.');
                    }
                });
            },
            () => {
                setLocating(false);
                setLocationError('Locatietoegang geweigerd. Vul de stad handmatig in.');
            }
        );
    };

    const handleSubmit = async () => {
        if (!city.trim()) {
            setSubmitError('Locatie is verplicht');
            return;
        }
        const blob = await signaturePadRef.current?.toBlob();
        if (!blob) {
            setSubmitError('Zet eerst je handtekening');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);
        const formData = new FormData();
        formData.append('signature', blob, 'signature.png');
        formData.append('city', city.trim());
        const result = await signMyNda(signatureId, formData);
        setSubmitting(false);

        if (!result.success) {
            setSubmitError(result.error);
            return;
        }
        router.push('/profiel/nda');
    };

    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-(--bg-card) border border-purple-100 p-6 shadow-sm">
                <h2 className="font-bold text-(--text-main) mb-2">NDA — {committeeName}</h2>
                <p className="text-sm text-(--text-muted) mb-4">Dit document is al ondertekend door de secretaris namens SV Salve Mundi.</p>
                <a
                    href={`/api/assets/${documentFileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-(--theme-purple) hover:underline"
                >
                    Document bekijken
                </a>
            </div>

            <div className="rounded-3xl bg-(--bg-card) border border-purple-100 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-(--text-main)">Locatie</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Stad waar je nu bent"
                        className="form-input flex-1 rounded-xl border border-purple-100 px-4 py-2.5 text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={locating}
                        className="form-button inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-(--bg-soft) text-(--theme-purple) text-sm font-bold hover:bg-(--theme-purple)/10 transition-colors disabled:opacity-50"
                    >
                        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                        Locatie ophalen
                    </button>
                </div>
                {locationError && <p className="text-xs font-semibold text-red-500">{locationError}</p>}
            </div>

            <div className="rounded-3xl bg-(--bg-card) border border-purple-100 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-(--text-main)">Jouw handtekening</h3>
                <SignaturePad ref={signaturePadRef} />
            </div>

            {submitError && <p className="text-sm font-semibold text-red-500">{submitError}</p>}

            <button
                type="button"
                onClick={() => { void handleSubmit(); }}
                disabled={submitting}
                className="form-button inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-(--theme-purple) text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Ondertekenen
            </button>
        </div>
    );
}
