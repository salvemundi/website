'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Undo2 } from 'lucide-react';
import { CAMERA_CHECKLIST_ITEMS, type CameraAdminLoan } from '@salvemundi/validations';
import { formatDate } from '@/shared/lib/utils/date';
import { returnCameraAction } from '@/server/actions/beheer/camera/beheer-camera.actions';

type Toast = (message: string, type: 'success' | 'error') => void;

function missingItems(loan: CameraAdminLoan) {
    return CAMERA_CHECKLIST_ITEMS.filter((i) => !loan.checklist[i.key]).map((i) => i.label);
}

function LoanCard({ loan, today, showToast }: { loan: CameraAdminLoan; today: string; showToast: Toast }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [returnedOn, setReturnedOn] = useState(today);
    const [condition, setCondition] = useState('');
    const open = loan.returned_on === null;
    const missing = missingItems(loan);

    const giveBack = () => {
        startTransition(async () => {
            const result = await returnCameraAction({ id: loan.id, returned_on: returnedOn, condition });
            if (result.success) {
                showToast('Terugbrengen geregistreerd', 'success');
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    return (
        <li className="space-y-3 rounded-2xl border border-border-color bg-bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-text-main">{loan.event_name}</span>
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black tracking-widest uppercase ${
                        open
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                    }`}
                >
                    {open ? 'Uitgeleend' : 'Teruggebracht'}
                </span>
                {loan.days_late > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[9px] font-black tracking-widest text-red-700 uppercase dark:bg-red-500/10 dark:text-red-300">
                        <AlertTriangle className="size-3" />
                        {loan.days_late} {loan.days_late === 1 ? 'dag' : 'dagen'} te laat
                    </span>
                )}
            </div>

            <div className="grid gap-1 text-xs text-text-muted sm:grid-cols-2">
                <p>Lener: {loan.borrower_name}</p>
                <p>Fotograaf: {loan.photographer_name ?? 'niet toegewezen'}</p>
                <p>Meegegeven: {formatDate(loan.handed_out_at, 'd MMM yyyy HH:mm')}</p>
                <p>Afgesproken tot: {formatDate(loan.agreed_end_date, 'd MMM yyyy')}</p>
                {loan.returned_on && <p>Teruggebracht: {formatDate(loan.returned_on, 'd MMM yyyy')}</p>}
            </div>

            <p
                className={`flex items-center gap-1.5 text-xs font-bold ${
                    loan.complete ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                }`}
            >
                {loan.complete ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                {loan.complete ? 'Compleet meegegeven' : `Niet compleet meegegeven: ${missing.join(', ')}`}
            </p>
            {loan.handout_note && <p className="text-xs text-text-muted">Bij meegeven: {loan.handout_note}</p>}
            {loan.condition_on_return && <p className="text-xs text-text-muted">Staat bij terugbrengen: {loan.condition_on_return}</p>}

            {open && (
                <div className="grid gap-3 border-t border-border-color pt-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
                        Teruggebracht op
                        <input type="date" className="form-input" value={returnedOn} onChange={(e) => setReturnedOn(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
                        Staat bij terugbrengen
                        <input
                            className="form-input"
                            value={condition}
                            maxLength={500}
                            placeholder="Bijv. alles compleet, geen schade"
                            onChange={(e) => setCondition(e.target.value)}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={giveBack}
                        disabled={isPending || !returnedOn}
                        className="beheer-button inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                        <Undo2 className="size-3.5" /> Teruggebracht
                    </button>
                </div>
            )}
        </li>
    );
}

export default function CameraLoansPanel({
    loans,
    today,
    showToast,
}: {
    loans: CameraAdminLoan[];
    today: string;
    showToast: Toast;
}) {
    if (loans.length === 0) {
        return <p className="py-12 text-center text-sm font-bold text-text-muted">Er is nog niets uitgeleend.</p>;
    }
    // Openstaande uitleen eerst, daarna op meegeef-datum (nieuwste eerst, zoals de query al sorteert).
    const sorted = [...loans].sort((a, b) => Number(a.returned_on !== null) - Number(b.returned_on !== null));
    return (
        <ul className="grid gap-4 lg:grid-cols-2">
            {sorted.map((l) => (
                <LoanCard key={l.id} loan={l} today={today} showToast={showToast} />
            ))}
        </ul>
    );
}
