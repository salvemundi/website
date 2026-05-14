'use client';

import React from 'react';
import { FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import { parseBoolean } from '@salvemundi/validations';
import { 
    HorizontalInput, 
    HorizontalDate, 
    HorizontalSelect, 
    HorizontalTextarea, 
    HorizontalCheckbox 
} from './TripSignupFormFields';

interface CockpitSignupFormProps {
    signup: TripSignup;
    initialData?: Partial<TripSignup>;
    isBusTrip?: boolean;
    section?: 'all' | 'personal' | 'admin' | 'personal_basic' | 'personal_extended';
}

export default function CockpitSignupForm({ 
    signup, 
    initialData, 
    isBusTrip, 
    section = 'all' 
}: CockpitSignupFormProps) {
    return (
        <div className="space-y-4">
            {/* Personal Basic Section */}
            {(section === 'all' || section === 'personal' || section === 'personal_basic') && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2 opacity-50">
                        <FileText className="h-3 w-3 text-[var(--beheer-accent)]" />
                        <h3 className="text-[11px] font-semibold text-[var(--beheer-text)]">Informatie</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-y-1">
                        <HorizontalInput label="Voornaam" name="first_name" defaultValue={initialData?.first_name || signup.first_name} required />
                        <HorizontalInput label="Achternaam" name="last_name" defaultValue={initialData?.last_name || signup.last_name} required />
                        <HorizontalInput label="Email" name="email" type="email" defaultValue={initialData?.email || signup.email} required />
                        <HorizontalInput label="Telefoon" name="phone_number" defaultValue={initialData?.phone_number || signup.phone_number || ''} />
                        <HorizontalDate label="Geb. Datum" name="date_of_birth" defaultValue={initialData?.date_of_birth || (signup.date_of_birth ? format(new Date(signup.date_of_birth), 'yyyy-MM-dd') : '')} />
                    </div>
                </div>
            )}

            {/* Personal Extended Section (Documents, Allergies, etc) */}
            {(section === 'all' || section === 'personal' || section === 'personal_extended') && (
                <div className="space-y-3">
                    {section === 'personal_extended' && (
                        <div className="flex items-center gap-2 mb-2 opacity-50">
                            <FileText className="h-3 w-3 text-[var(--beheer-accent)]" />
                            <h3 className="text-[11px] font-semibold text-[var(--beheer-text)]">Documenten & Extra</h3>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-y-1">
                        {!isBusTrip && (
                            <>
                                <HorizontalSelect label="ID Type" name="id_document" defaultValue={initialData?.id_document || signup.id_document || ''}>
                                    <option value="">Niet opgegeven</option>
                                    <option value="passport">Paspoort</option>
                                    <option value="id_card">ID Kaart</option>
                                </HorizontalSelect>
                                <HorizontalInput label="ID Nummer" name="document_number" defaultValue={initialData?.document_number || signup.document_number || ''} />
                                <HorizontalDate label="Vervaldatum" name="document_expiry_date" defaultValue={initialData?.document_expiry_date || (signup.document_expiry_date ? format(new Date(signup.document_expiry_date), 'yyyy-MM-dd') : '')} />
                            </>
                        )}
                        <div className="grid grid-cols-1 gap-2 pt-2">
                            <HorizontalTextarea label="Allergieën" name="allergies" defaultValue={initialData?.allergies || signup.allergies || ''} />
                            <HorizontalTextarea label="Bijzonderheden" name="special_notes" defaultValue={initialData?.special_notes || signup.special_notes || ''} />
                        </div>
                        <div className="flex items-center gap-6 mt-2 px-1">
                            {!isBusTrip && <HorizontalCheckbox label="Extra Koffer" name="extra_luggage" defaultChecked={initialData ? parseBoolean(initialData.extra_luggage) : parseBoolean(signup.extra_luggage)} />}
                            {isBusTrip && <HorizontalCheckbox label="Chauffeur" name="willing_to_drive" defaultChecked={initialData ? parseBoolean(initialData.willing_to_drive) : parseBoolean(signup.willing_to_drive)} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Section */}
            {(section === 'all' || section === 'admin') && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2 opacity-50">
                        <CreditCard className="h-3 w-3 text-[var(--beheer-accent)]" />
                        <h3 className="text-[11px] font-semibold text-[var(--beheer-text)]">Beheer</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-y-1">
                        <HorizontalSelect label="Status" name="status" defaultValue={initialData?.status || signup.status || undefined}>
                            <option value="registered">Geregistreerd</option>
                            <option value="confirmed">Bevestigd</option>
                            <option value="waitlist">Wachtlijst</option>
                            <option value="cancelled">Geannuleerd</option>
                        </HorizontalSelect>
                        <HorizontalSelect label="Rol" name="role" defaultValue={initialData?.role || signup.role || undefined}>
                            <option value="participant">Regulier</option>
                            <option value="crew">Crew</option>
                        </HorizontalSelect>
                        <div className="pt-3 flex flex-col gap-2 px-1">
                            <div className="flex items-center justify-between">
                                <HorizontalCheckbox label="Aanbetaling" name="deposit_paid" defaultChecked={initialData ? parseBoolean(initialData.deposit_paid) : parseBoolean(signup.deposit_paid)} />
                                {signup.deposit_paid_at && <span className="text-[8px] font-semibold text-[var(--beheer-text-muted)] opacity-50">{format(new Date(signup.deposit_paid_at), 'd MMM yy', { locale: nl })}</span>}
                            </div>
                            <div className="flex items-center justify-between">
                                <HorizontalCheckbox label="Restbetaling" name="full_payment_paid" defaultChecked={initialData ? parseBoolean(initialData.full_payment_paid) : parseBoolean(signup.full_payment_paid)} />
                                {signup.full_payment_paid_at && <span className="text-[8px] font-semibold text-[var(--beheer-text-muted)] opacity-50">{format(new Date(signup.full_payment_paid_at), 'd MMM yy', { locale: nl })}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
