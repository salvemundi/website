import React from 'react';
import { 
    User, 
    Info, 
    Calendar, 
    IdCard, 
    Phone, 
    HeartPulse, 
    FileText, 
    Bus 
} from 'lucide-react';
import { DateInput } from '@/shared/ui/DateInput';
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/reis.zod';
import { type Trip } from '@salvemundi/validations/schema/admin-reis.zod';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';

interface EnrichmentFormProps {
    trip: Trip;
    enrichment: ReisPaymentEnrichment;
    setEnrichment: (enrichment: ReisPaymentEnrichment) => void;
}

export function EnrichmentForm({ trip, enrichment, setEnrichment }: EnrichmentFormProps) {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-[var(--text-main)] mb-2 uppercase italic tracking-tighter italic">Gegevens voor de Aanbetaling</h2>
                <p className="text-[var(--text-muted)]">Controleer en vul je gegevens aan voor de aanbetaling van de reis naar {trip.name}.</p>
            </div>

            <div className="space-y-12">
                {/* Group 1: Identity */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-theme-purple/10 flex items-center justify-center text-theme-purple">
                            <User className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">Identiteit & Geboorte</h3>
                    </div>

                    {/* Identity Rule Notice */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 animate-in slide-in-from-left-2 duration-500">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-200/80 font-medium leading-relaxed uppercase tracking-tight">
                            <strong className="text-blue-300">Belangrijk:</strong> Je voor- en achternaam moeten <strong className="text-[var(--text-main)]">exact</strong> overeenkomen met de gegevens op je paspoort of ID-kaart voor de boeking.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]/20">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Voornaam *</label>
                            <input 
                                type="text"
                                value={enrichment.first_name}
                                onChange={(e) => setEnrichment({...enrichment, first_name: e.target.value})}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Achternaam *</label>
                            <input 
                                type="text"
                                value={enrichment.last_name}
                                onChange={(e) => setEnrichment({...enrichment, last_name: e.target.value})}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Geboortedatum *
                            </label>
                            <DateInput 
                                name="date_of_birth"
                                value={enrichment.date_of_birth}
                                onChange={(val) => setEnrichment({...enrichment, date_of_birth: val})}
                                autoComplete="off"
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                <IdCard className="w-3 h-3" /> ID Document Type *
                            </label>
                            <select 
                                value={enrichment.id_document}
                                onChange={(e) => setEnrichment({...enrichment, id_document: e.target.value})}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all appearance-none font-medium"
                            >
                                <option value="none">Maak een keuze...</option>
                                <option value="id_card">ID-kaart</option>
                                <option value="passport">Paspoort</option>
                            </select>
                        </div>

                        {enrichment.id_document !== 'none' && (
                            <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Documentnummer *</label>
                                <input 
                                    type="text"
                                    placeholder="Bijv. ABC123456"
                                    value={enrichment.document_number || ''}
                                    onChange={(e) => setEnrichment({...enrichment, document_number: e.target.value})}
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all font-medium"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Group 2: Contact */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-theme-purple/10 flex items-center justify-center text-theme-purple">
                            <Phone className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">Contactgegevens</h3>
                    </div>
                    <div className="grid md:grid-cols-1 gap-6 p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]/20">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                Telefoonnummer *
                            </label>
                            <input 
                                type="tel"
                                placeholder="+31 6 12345678"
                                value={formatPhoneNumber(enrichment.phone_number)}
                                onChange={(e) => setEnrichment({...enrichment, phone_number: e.target.value})}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Group 3: Medical & Notes */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-theme-purple/10 flex items-center justify-center text-theme-purple">
                            <HeartPulse className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">Medisch & Opmerkingen</h3>
                    </div>
                    <div className="grid md:grid-cols-1 gap-6 p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]/20">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                Allergieën & Medisch
                            </label>
                            <textarea 
                                placeholder="Bijv. Notenallergie, medicijngebruik..."
                                value={enrichment.allergies || ''}
                                onChange={(e) => setEnrichment({...enrichment, allergies: e.target.value})}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all min-h-[100px] font-medium resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Speciale Opmerkingen
                            </label>
                            <textarea 
                                placeholder="Andere zaken waar we rekening mee moeten houden?"
                                value={enrichment.special_notes || ''}
                                onChange={(e) => setEnrichment({...enrichment, special_notes: e.target.value})}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/40 rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-theme-purple/50 transition-all min-h-[100px] font-medium resize-none"
                            />
                        </div>
                    </div>
                </div>

                {trip.is_bus_trip && (
                    <div className="p-6 rounded-2xl bg-theme-purple/5 border border-theme-purple/20 flex items-center justify-between animate-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-theme-purple/10 flex items-center justify-center text-theme-purple shadow-glow-sm">
                                <Bus className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-[var(--text-main)] text-sm uppercase tracking-tight">Vrijwillige Chauffeur?</p>
                                <p className="text-xs text-[var(--text-muted)] font-medium">Ben je bereid om een van de busjes te rijden?</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={enrichment.willing_to_drive || false}
                                onChange={(e) => setEnrichment({...enrichment, willing_to_drive: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-[var(--bg-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-purple"></div>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
