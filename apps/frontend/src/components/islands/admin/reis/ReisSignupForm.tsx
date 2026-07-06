'use client';

import React from 'react';
import type { TripSignup } from '@salvemundi/validations/schema/admin-trip.zod';
import ReisCockpitSignupForm from './ReisCockpitSignupForm';
import ReisStandardSignupForm from './ReisStandardSignupForm';

interface SignupFormProps {
    signup: TripSignup;
    initialData?: Partial<TripSignup>;
    isBusTrip?: boolean;
    minimal?: boolean;
    section?: 'all' | 'personal' | 'admin' | 'personal_basic' | 'personal_extended';
    compact?: boolean;
    cockpit?: boolean;
}

/**
 * SignupForm: Beheert de weergave van het aanmeldformulier voor reizen.
 * Switcht tussen de Cockpit (compact/horizontaal) en Standard (gedetailleerd) weergave.
 */
export default function SignupForm(props: SignupFormProps) {
    if (props.cockpit) {
        return (
            <ReisCockpitSignupForm 
                signup={props.signup}
                initialData={props.initialData}
                isBusTrip={props.isBusTrip}
                section={props.section}
            />
        );
    }

    return (
        <ReisStandardSignupForm 
            signup={props.signup}
            initialData={props.initialData}
            isBusTrip={props.isBusTrip}
            minimal={props.minimal}
            section={props.section}
            compact={props.compact}
        />
    );
}
