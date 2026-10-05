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
        const geo = typeof window !== 'undefined' ? window.navigator.geolocation : undefined;
        if (!geo) {
            setLocationError('Locatiebepaling wordt niet ondersteund door je browser. Vul de stad handmatig in.');
            return;
        }
        setLocating(true);
        setLocationError(null);
        geo.getCurrentPosition(
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
            <div className="rounded-3xl border border-theme-purple/20 bg-(--bg-card) p-6 shadow-sm">
                <h2 className="mb-2 font-bold text-(--text-main)">NDA — {committeeName}</h2>
                <p className="mb-4 text-sm text-(--text-muted)">Dit document is al ondertekend door de secretaris namens SV Salve Mundi.</p>
                <a
                    href={`/api/assets/${documentFileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-(--theme-purple) hover:underline"
                >
                    Document bekijken
                </a>
            </div>

            <div className="space-y-4 rounded-3xl border border-theme-purple/20 bg-(--bg-card) p-6 shadow-sm">
                <h3 className="font-bold text-(--text-main)">Locatie</h3>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Stad waar je nu bent"
                        className="form-input"
                    />
                    <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={locating}
                        className="form-button bg-(--bg-soft) text-(--theme-purple) hover:bg-(--theme-purple)/10"
                    >
                        {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                        Locatie ophalen
                    </button>
                </div>
                {locationError && <p className="text-xs font-semibold text-red-500">{locationError}</p>}
            </div>

            <div className="space-y-4 rounded-3xl border border-theme-purple/20 bg-(--bg-card) p-6 shadow-sm">
                <h3 className="font-bold text-(--text-main)">Jouw handtekening</h3>
                <SignaturePad ref={signaturePadRef} />
            </div>

            {submitError && <p className="text-sm font-semibold text-red-500">{submitError}</p>}

            <button
                type="button"
                onClick={() => { void handleSubmit(); }}
                disabled={submitting}
                className="form-button transition-opacity"
            >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Ondertekenen
            </button>
        </div>
    );
}
