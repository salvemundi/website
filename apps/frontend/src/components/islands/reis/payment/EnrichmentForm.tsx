'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { 
    Bus,
    AlertCircle,
    Briefcase,
    User
} from 'lucide-react';
import { DateInput } from '@/shared/ui/DateInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/reis.zod';
import { type Trip } from '@salvemundi/validations/schema/admin-reis.zod';

interface EnrichmentFormProps {
    trip: Trip;
    hideHeader?: boolean;
}

export function EnrichmentForm({ trip, hideHeader = false }: EnrichmentFormProps) {
    const { register, control, formState: { errors } } = useFormContext<ReisPaymentEnrichment>();

    return (
        <div className="space-y-6">
            <input type="hidden" {...register('is_bus_trip')} />
            {!hideHeader && (
                <header className="mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                    <h2 className="text-2xl sm:text-3xl font-black text-(--text-main) mb-1 italic tracking-tighter flex items-center gap-3">
                        <User className="w-7 h-7 text-theme-purple" />
                        Reisgegevens
                    </h2>
                    <p className="text-(--text-muted) text-sm">Vul je gegevens aan voor <span className="text-theme-purple font-bold">{trip.name}</span>.</p>
                </header>
            )}

            <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-x-6 gap-y-5">
                {/* Identity */}
                <div className="@md:col-span-1">
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
                        <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                            <span>→</span> LET OP: MOET EXACT OVEREENKOMEN MET JE ID-BEWIJS!
                        </p>
                    </FormField>
                </div>

                <div className="@md:col-span-1">
                    <FormField id="last_name" label="Achternaam" required error={errors.last_name?.message}>
                        <Input {...register('last_name')} placeholder="Achternaam" />
                    </FormField>
                </div>

                <div className="@md:col-span-1">
                    <FormField id="date_of_birth" label="Geboortedatum" required error={errors.date_of_birth?.message}>
                        <Controller 
                            name="date_of_birth"
                            control={control}
                            render={({ field }) => <DateInput {...field} autoComplete="off" />}
                        />
                    </FormField>
                </div>

                <div className="@md:col-span-1">
                    <FormField id="phone_number" label="Telefoonnummer" required error={errors.phone_number?.message}>
                        <Controller 
                            name="phone_number"
                            control={control}
                            render={({ field }) => <PhoneInput {...field} />}
                        />
                    </FormField>
                </div>

                {!trip.is_bus_trip && (
                    <>
                        <div className="@md:col-span-1">
                            <FormField id="id_document" label="ID Document Type" required error={errors.id_document?.message}>
                                <select {...register('id_document')} className="form-input" autoComplete="off">
                                    <option value="none">Maak een keuze...</option>
                                    <option value="id_card">ID-kaart</option>
                                    <option value="passport">Paspoort</option>
                                </select>
                            </FormField>
                        </div>

                        <div className="@md:col-span-1">
                            <FormField id="document_number" label="Documentnummer" required error={errors.document_number?.message}>
                                <Input 
                                    {...register('document_number')} 
                                    placeholder="Bijv. ABC123456" 
                                    autoComplete="off"
                                    minLength={6}
                                    maxLength={12}
                                />
                            </FormField>
                        </div>

                        <div className="@md:col-span-1">
                            <FormField id="document_expiry_date" label="Vervaldatum Document" required error={errors.document_expiry_date?.message}>
                                <Controller 
                                    name="document_expiry_date"
                                    control={control}
                                    render={({ field }) => <DateInput {...field} value={field.value ?? undefined} autoComplete="off" />}
                                />
                            </FormField>
                        </div>
                    </>
                )}

                <div className="@md:col-span-1">
                    <FormField id="allergies" label="Allergieën & Medisch" error={errors.allergies?.message}>
                        <textarea {...register('allergies')} placeholder="Bijv. Notenallergie, medicijngebruik..." className="form-input min-h-[80px]" autoComplete="off" />
                    </FormField>
                </div>

                <div className="@md:col-span-1">
                    <FormField id="special_notes" label="Speciale Opmerkingen" error={errors.special_notes?.message}>
                        <textarea {...register('special_notes')} placeholder="Overige zaken..." className="form-input min-h-[80px]" autoComplete="off" />
                    </FormField>
                </div>

                <div className="col-span-1 @md:col-span-2 @3xl:col-span-3">
                    {trip.is_bus_trip && (
                        <div className="p-4 squircle bg-theme-purple/5 flex items-center justify-start gap-8">
                            <div className="flex items-center gap-3 min-w-[180px]">
                                <Bus className="w-5 h-5 text-theme-purple" />
                                <div>
                                    <p className="font-bold text-(--text-main) text-sm">Vrijwillige Chauffeur?</p>
                                    <p className="text-[10px] text-(--text-muted)">Bereid om een busje te rijden.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input {...register('willing_to_drive')} type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-(--bg-soft) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-purple"></div>
                            </label>
                        </div>
                    )}

                    {!trip.is_bus_trip && (
                        <div className="p-4 squircle bg-theme-purple/5 flex items-center justify-start gap-8">
                            <div className="flex items-center gap-3 min-w-[180px]">
                                <Briefcase className="w-5 h-5 text-theme-purple" />
                                <div>
                                    <p className="font-bold text-(--text-main) text-sm">Extra Koffer?</p>
                                    <p className="text-[10px] text-(--text-muted)">Ik wil een grote koffer meenemen.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input {...register('extra_luggage')} type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-(--bg-soft) peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-purple"></div>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
