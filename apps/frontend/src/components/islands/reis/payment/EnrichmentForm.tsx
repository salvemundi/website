'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { 
    User, 
    Calendar, 
    IdCard, 
    Phone, 
    HeartPulse, 
    Bus,
    AlertCircle,
    Briefcase
} from 'lucide-react';
import { DateInput } from '@/shared/ui/DateInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/reis.zod';
import { type Trip } from '@salvemundi/validations/schema/admin-reis.zod';

interface EnrichmentFormProps {
    trip: Trip;
}

export function EnrichmentForm({ trip }: EnrichmentFormProps) {
    const { register, control, watch, formState: { errors } } = useFormContext<ReisPaymentEnrichment>();
    const idDocument = watch('id_document');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="mb-4">
                <h2 className="text-3xl font-black text-[var(--text-main)] mb-1 uppercase italic tracking-tighter">Reisgegevens</h2>
                <p className="text-[var(--text-muted)] text-sm">Vul je gegevens aan voor <span className="text-theme-purple font-bold">{trip.name}</span>.</p>
                <input type="hidden" {...register('is_bus_trip')} />
            </header>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Identity */}
                <div className="md:col-span-1">
                    <FormField id="first_name" label="Voornaam (zoals op ID/Paspoort)" required error={errors.first_name?.message}>
                        <div className="relative group">
                            <Input 
                                {...register('first_name')} 
                                placeholder="Volledige voornaam" 
                                className="pr-10" 
                                /* We use 'one-time-code' to block Chrome's aggressive autofill. */
                                autoComplete="one-time-code"
                            />
                            <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1">
                            <span className="animate-pulse">→</span> LET OP: MOET EXACT OVEREENKOMEN MET JE ID-BEWIJS!
                        </p>
                    </FormField>
                </div>

                <FormField id="last_name" label="Achternaam" required error={errors.last_name?.message}>
                    <Input {...register('last_name')} placeholder="Achternaam" />
                </FormField>

                <FormField id="date_of_birth" label="Geboortedatum" required error={errors.date_of_birth?.message}>
                    <Controller 
                        name="date_of_birth"
                        control={control}
                        render={({ field }) => <DateInput {...field} autoComplete="off" />}
                    />
                </FormField>

                <FormField id="phone_number" label="Telefoonnummer" required error={errors.phone_number?.message}>
                    <Controller 
                        name="phone_number"
                        control={control}
                        render={({ field }) => <PhoneInput {...field} />}
                    />
                </FormField>

                {!trip.is_bus_trip && (
                    <>
                        <FormField id="id_document" label="ID Document Type" required error={errors.id_document?.message}>
                            <select {...register('id_document')} className="form-input" autoComplete="off">
                                <option value="none">Maak een keuze...</option>
                                <option value="id_card">ID-kaart</option>
                                <option value="passport">Paspoort</option>
                            </select>
                        </FormField>

                        <FormField id="document_number" label="Documentnummer" required error={errors.document_number?.message}>
                            <Input 
                                {...register('document_number')} 
                                placeholder="Bijv. ABC123456" 
                                autoComplete="off"
                                minLength={6}
                                maxLength={12}
                            />
                        </FormField>

                        <FormField id="document_expiry_date" label="Vervaldatum Document" required error={errors.document_expiry_date?.message}>
                            <Controller 
                                name="document_expiry_date"
                                control={control}
                                render={({ field }) => <DateInput {...field} value={field.value ?? undefined} autoComplete="off" />}
                            />
                        </FormField>
                    </>
                )}

                <div className="md:col-span-2">
                    <FormField id="allergies" label="Allergieën & Medisch" error={errors.allergies?.message}>
                        <textarea {...register('allergies')} placeholder="Bijv. Notenallergie, medicijngebruik..." className="form-input min-h-[80px]" autoComplete="off" />
                    </FormField>
                </div>

                <div className="md:col-span-2">
                    <FormField id="special_notes" label="Speciale Opmerkingen" error={errors.special_notes?.message}>
                        <textarea {...register('special_notes')} placeholder="Overige zaken..." className="form-input min-h-[80px]" autoComplete="off" />
                    </FormField>
                </div>

                <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                    {trip.is_bus_trip && (
                        <div className="p-4 rounded-xl bg-theme-purple/5 flex items-center justify-start gap-8">
                            <div className="flex items-center gap-3 min-w-[180px]">
                                <Bus className="w-5 h-5 text-theme-purple" />
                                <div>
                                    <p className="font-bold text-[var(--text-main)] text-sm">Vrijwillige Chauffeur?</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">Bereid om een busje te rijden.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input {...register('willing_to_drive')} type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-[var(--bg-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-purple"></div>
                            </label>
                        </div>
                    )}

                    {!trip.is_bus_trip && (
                        <div className="p-4 rounded-xl bg-theme-purple/5 flex items-center justify-start gap-8">
                            <div className="flex items-center gap-3 min-w-[180px]">
                                <Briefcase className="w-5 h-5 text-theme-purple" />
                                <div>
                                    <p className="font-bold text-[var(--text-main)] text-sm">Extra Koffer?</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">Ik wil een grote koffer meenemen.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input {...register('extra_luggage')} type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-[var(--bg-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-purple"></div>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
