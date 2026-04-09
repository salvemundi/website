'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Check, 
    CreditCard, 
    ChevronRight, 
    User, 
    Info, 
    AlertCircle, 
    Loader2, 
    Calendar, 
    IdCard, 
    HeartPulse, 
    Bus,
    ArrowRight,
    Phone,
    FileText,
    CheckCircle2,
    Home
} from 'lucide-react';
import { format } from 'date-fns';
import type { 
    Trip, 
    TripSignup, 
    TripActivity, 
    TripSignupActivity,
    ReisPaymentEnrichment
} from '@salvemundi/validations';
import ActivitySelector from './ActivitySelector';
import { DateInput } from '@/shared/ui/DateInput';
import { 
    updateSignupDetails, 
    syncSignupActivities, 
    initiateTripPaymentAction 
} from '@/server/actions/reis-payment.actions';

interface TripPaymentFlowProps {
    signup: TripSignup;
    trip: Trip;
    allActivities: TripActivity[];
    selectedActivities: TripSignupActivity[];
    paymentType: 'deposit' | 'final';
    token?: string;
}

export default function TripPaymentFlowIsland({ 
    signup, 
    trip, 
    allActivities, 
    selectedActivities, 
    paymentType,
    token 
}: TripPaymentFlowProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form State
    const [enrichment, setEnrichment] = useState<ReisPaymentEnrichment>({
        first_name: signup.first_name || '',
        last_name: signup.last_name || '',
        phone_number: signup.phone_number || '',
        date_of_birth: signup.date_of_birth ? format(new Date(signup.date_of_birth), 'yyyy-MM-dd') : '',
        id_document: signup.id_document || 'none',
        document_number: signup.document_number || '',
        allergies: signup.allergies || '',
        special_notes: signup.special_notes || '',
        willing_to_drive: signup.willing_to_drive || false,
    });

    const [activitySelections, setActivitySelections] = useState<{ activityId: number, options: any }[]>(
        selectedActivities.map(sa => ({
            activityId: typeof sa.trip_activity_id === 'object' ? (sa.trip_activity_id as any).id : Number(sa.trip_activity_id),
            options: sa.selected_options || {}
        }))
    );

    // Pricing Calculation
    const pricing = useMemo(() => {
        const base = Number(trip.base_price || 0);
        const discount = (signup.role === 'crew' ? Number(trip.crew_discount || 0) : 0);
        
        const actPrice = activitySelections.reduce((sum, sel) => {
            const activity = allActivities.find(a => a.id === sel.activityId);
            if (!activity) return sum;
            
            let total = Number(activity.price || 0);
            // Add sub-option prices if any
            if (activity.options && Array.isArray(activity.options)) {
                activity.options.forEach(opt => {
                    const optId = opt.id;
                    if (optId && sel.options[optId]) {
                        total += Number(opt.price || 0);
                    }
                });
            }
            return sum + total;
        }, 0);

        const total = base - discount + actPrice;
        const deposit = Number(trip.deposit_amount || 0);
        const remaining = total - deposit;
        const toPayNow = paymentType === 'deposit' ? deposit : remaining;

        return {
            base,
            discount,
            actPrice,
            total,
            deposit,
            remaining,
            toPayNow
        };
    }, [trip, signup.role, activitySelections, allActivities, paymentType]);

    const handleNext = async () => {
        setError(null);
        setLoading(true);

        try {
            if (step === 1) {
                const res = await updateSignupDetails(signup.id!, enrichment, token);
                if (!res.success) {
                    setError(res.error || 'Fout bij opslaan gegevens.');
                    setLoading(false);
                    return;
                }
            } else if (step === 2) {
                const res = await syncSignupActivities(signup.id!, activitySelections, token);
                if (!res.success) {
                    setError(res.error || 'Fout bij opslaan activiteiten.');
                    setLoading(false);
                    return;
                }

                // If final payment is not open, we stop here
                if (paymentType === 'final' && !trip.allow_final_payments) {
                    setStep(4);
                    setLoading(false);
                    return;
                }
            }

            setStep(step + 1);
        } catch (err) {
            setError('Er is een onverwachte fout opgetreden. Probeer het later opnieuw.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartPayment = async () => {
        setError(null);
        setIsProcessing(true);

        try {
            const res = await initiateTripPaymentAction(signup.id!, paymentType, token);
            if (res.success && res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            } else {
                setError(res.error || 'Betaalsessie starten mislukt.');
                setIsProcessing(false);
            }
        } catch (err) {
            setError('Fout bij verbinden met betaalservice.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Step Header */}
            <div className="flex items-center justify-center gap-4 mb-12">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                            step === s ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 
                            step > s ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-500 border border-white/10'
                        }`}>
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-8 md:w-16 h-[2px] transition-all ${step > s ? 'bg-green-500' : 'bg-white/10'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                {/* Step Content */}
                <div className="p-8 md:p-12">
                    {step === 1 && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div>
                                <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter italic">Gegevens voor de Aanbetaling</h2>
                                <p className="text-gray-400">Controleer en vul je gegevens aan voor de aanbetaling van de reis naar {trip.name}.</p>
                            </div>

                            <div className="space-y-12">
                                {/* Group 1: Identity */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Identiteit & Geboorte</h3>
                                    </div>

                                    {/* Identity Rule Notice */}
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 animate-in slide-in-from-left-2 duration-500">
                                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-blue-200/80 font-medium leading-relaxed uppercase tracking-tight">
                                            <strong className="text-blue-300">Belangrijk:</strong> Je voor- en achternaam moeten <strong className="text-white">exact</strong> overeenkomen met de gegevens op je paspoort of ID-kaart voor de boeking.
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Voornaam *</label>
                                            <input 
                                                type="text"
                                                value={enrichment.first_name}
                                                onChange={(e) => setEnrichment({...enrichment, first_name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Achternaam *</label>
                                            <input 
                                                type="text"
                                                value={enrichment.last_name}
                                                onChange={(e) => setEnrichment({...enrichment, last_name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" /> Geboortedatum *
                                            </label>
                                            <DateInput 
                                                name="date_of_birth"
                                                value={enrichment.date_of_birth}
                                                onChange={(val) => setEnrichment({...enrichment, date_of_birth: val})}
                                                autoComplete="off"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                                <IdCard className="w-3 h-3" /> ID Document Type *
                                            </label>
                                            <select 
                                                value={enrichment.id_document}
                                                onChange={(e) => setEnrichment({...enrichment, id_document: e.target.value})}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none font-medium"
                                            >
                                                <option value="none">Maak een keuze...</option>
                                                <option value="id_card">ID-kaart</option>
                                                <option value="passport">Paspoort</option>
                                            </select>
                                        </div>

                                        {enrichment.id_document !== 'none' && (
                                            <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Documentnummer *</label>
                                                <input 
                                                    type="text"
                                                    placeholder="Bijv. ABC123456"
                                                    value={enrichment.document_number || ''}
                                                    onChange={(e) => setEnrichment({...enrichment, document_number: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Group 2: Contact */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Contactgegevens</h3>
                                    </div>
                                    <div className="grid md:grid-cols-1 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                                Telefoonnummer *
                                            </label>
                                            <input 
                                                type="tel"
                                                placeholder="+31 6 12345678"
                                                value={enrichment.phone_number}
                                                onChange={(e) => setEnrichment({...enrichment, phone_number: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Group 3: Medical & Notes */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <HeartPulse className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Medisch & Opmerkingen</h3>
                                    </div>
                                    <div className="grid md:grid-cols-1 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                                Allergieën & Medisch
                                            </label>
                                            <textarea 
                                                placeholder="Bijv. Notenallergie, medicijngebruik..."
                                                value={enrichment.allergies || ''}
                                                onChange={(e) => setEnrichment({...enrichment, allergies: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all min-h-[100px] font-medium resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                                <FileText className="w-3 h-3" /> Speciale Opmerkingen
                                            </label>
                                            <textarea 
                                                placeholder="Andere zaken waar we rekening mee moeten houden?"
                                                value={enrichment.special_notes || ''}
                                                onChange={(e) => setEnrichment({...enrichment, special_notes: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all min-h-[100px] font-medium resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {trip.is_bus_trip && (
                                    <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-between animate-in zoom-in-95 duration-500">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-glow-sm">
                                                <Bus className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-sm uppercase tracking-tight">Vrijwillige Chauffeur?</p>
                                                <p className="text-xs text-gray-500 font-medium">Ben je bereid om een van de busjes te rijden?</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={enrichment.willing_to_drive || false}
                                                onChange={(e) => setEnrichment({...enrichment, willing_to_drive: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in duration-500">
                            <ActivitySelector 
                                activities={allActivities}
                                selectedSelections={activitySelections}
                                onChange={setActivitySelections}
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Betalingssamenvatting</h2>
                                <p className="text-gray-400">Controleer de gegevens voordat we je doorsturen naar Mollie.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Basisprijs Reis</span>
                                        <span className="text-white font-bold">€{pricing.base.toFixed(2)}</span>
                                    </div>
                                    {pricing.discount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-green-500 italic">Crew Korting</span>
                                            <span className="text-green-500 font-bold">-€{pricing.discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {pricing.actPrice > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Optionele Activiteiten</span>
                                            <span className="text-white font-bold">+€{pricing.actPrice.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-white font-black uppercase text-xs tracking-widest">Totaalbedrag</span>
                                        <span className="text-xl font-black text-white uppercase italic">€{pricing.total.toFixed(2)}</span>
                                    </div>
                                    {paymentType === 'final' && (
                                        <div className="flex justify-between items-center text-sm pt-2">
                                            <span className="text-green-500 italic">Reeds voldaan (Aanbetaling)</span>
                                            <span className="text-green-500 font-bold">-€{pricing.deposit.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/10 text-white">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                                                {paymentType === 'deposit' ? 'Nu te voldoen (Aanbetaling)' : 'Nu te voldoen (Restbetaling)'}
                                            </p>
                                            <h3 className="text-5xl font-black italic tracking-tighter italic">€{pricing.toPayNow.toFixed(2)}</h3>
                                        </div>
                                        <CreditCard className="w-12 h-12 opacity-30 -mb-2 -mr-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-12 animate-in zoom-in-95 duration-500 py-12 text-center">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto shadow-2xl shadow-green-500/10">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter italic">Activiteiten Opgeslagen!</h2>
                                <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                                    Je keuzes zijn succesvol verwerkt. Zodra de restbetaling voor <strong>{trip.name}</strong> wordt geopend, ontvang je van ons een e-mail om de betaling af te ronden.
                                </p>
                            </div>

                            <a 
                                href="/reis" 
                                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-orange-500 hover:text-white transition-all shadow-xl shadow-white/5"
                            >
                                <Home className="w-5 h-5" />
                                Terug naar Dashboard
                            </a>
                        </div>
                    )}
                </div>

                {/* Navigation Bar */}
                {step < 4 && (
                    <div className="px-8 pb-8 md:px-12 md:pb-12 pt-0 flex flex-col md:flex-row gap-4">
                        {step > 1 && !isProcessing && (
                            <button 
                                disabled={loading}
                                onClick={() => setStep(step - 1)}
                                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                Vorige
                            </button>
                        )}
                        
                        {step < 3 ? (
                            <button 
                                disabled={loading}
                                onClick={handleNext}
                                className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <>
                                        {step === 2 && paymentType === 'final' && !trip.allow_final_payments ? 'Keuzes Opslaan' : 'Opslaan & Volgende'}
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        ) : (
                            <button 
                                disabled={isProcessing}
                                onClick={handleStartPayment}
                                className="flex-1 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-[var(--sm-orange)] hover:text-white transition-all shadow-2xl shadow-orange-500/10 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <>
                                        Betaal nu met Mollie
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-xs">
                <Info className="w-3.5 h-3.5" />
                <p>Betalingen worden beveiligd verwerkt door Mollie. Je wordt omgeleid naar een veilige betaalomgeving.</p>
            </div>
        </div>
    );
}
