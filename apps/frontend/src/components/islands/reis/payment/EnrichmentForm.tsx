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
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/trip.zod';
import { type Trip } from '@salvemundi/validations/schema/admin-trip.zod';

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
                <header className="mb-6 border-b border-black/5 pb-4 dark:border-white/10">
                    <h2 className="mb-1 flex items-center gap-3 text-2xl font-black tracking-tighter text-(--text-main) italic sm:text-3xl">
                        <User className="size-7 text-theme-purple" />
                        Reisgegevens
                    </h2>
                    <p className="text-sm text-(--text-muted)">Vul je gegevens aan voor <span className="font-bold text-theme-purple">{trip.name}</span>.</p>
                </header>
            )}

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 @md:grid-cols-2 @3xl:grid-cols-3">
                {/* Identity */}
                <div className="@md:col-span-1">
                    <FormField id="first_name" label="Voornaam (zoals op ID/Paspoort)" required error={errors.first_name?.message}>
                        <div className="group relative">
                            <Input 
                                {...register('first_name')} 
                                placeholder="Volledige voornaam" 
                                className="pr-10" 
                                /* We use 'one-time-code' to block Chrome's aggressive autofill. */
                                autoComplete="one-time-code"
                            />
                            <AlertCircle className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-red-500 opacity-50 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-500">
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
                        <textarea {...register('allergies')} placeholder="Bijv. Notenallergie, medicijngebruik..." className="min-h-20 form-input" autoComplete="off" />
                    </FormField>
                </div>

                <div className="@md:col-span-1">
                    <FormField id="special_notes" label="Speciale Opmerkingen" error={errors.special_notes?.message}>
                        <textarea {...register('special_notes')} placeholder="Overige zaken..." className="min-h-20 form-input" autoComplete="off" />
                    </FormField>
                </div>

                <div className="col-span-1 @md:col-span-2 @3xl:col-span-3">
                    {trip.is_bus_trip && (
                        <div className="squircle flex items-center justify-start gap-8 bg-theme-purple/5 p-4">
                            <div className="flex min-w-45 items-center gap-3">
                                <Bus className="size-5 text-theme-purple" />
                                <div>
                                    <p className="text-sm font-bold text-(--text-main)">Vrijwillige Chauffeur?</p>
                                    <p className="text-[10px] text-(--text-muted)">Bereid om een busje te rijden.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input {...register('willing_to_drive')} type="checkbox" className="peer sr-only" />
                                <div className="peer h-6 w-11 rounded-full bg-(--bg-soft) peer-checked:bg-theme-purple peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                            </label>
                        </div>
                    )}

                    {!trip.is_bus_trip && (
                        <div className="squircle flex items-center justify-start gap-8 bg-theme-purple/5 p-4">
                            <div className="flex min-w-45 items-center gap-3">
                                <Briefcase className="size-5 text-theme-purple" />
                                <div>
                                    <p className="text-sm font-bold text-(--text-main)">Extra Koffer?</p>
                                    <p className="text-[10px] text-(--text-muted)">Ik wil een grote koffer meenemen.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input {...register('extra_luggage')} type="checkbox" className="peer sr-only" />
                                <div className="peer h-6 w-11 rounded-full bg-(--bg-soft) peer-checked:bg-theme-purple peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
