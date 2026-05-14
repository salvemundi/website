'use client';

import React from 'react';
import type { TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import CockpitSignupForm from './CockpitSignupForm';
import StandardSignupForm from './StandardSignupForm';

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
            <CockpitSignupForm 
                signup={props.signup}
                initialData={props.initialData}
                isBusTrip={props.isBusTrip}
                section={props.section}
            />
        );
    }

    return (
        <StandardSignupForm 
            signup={props.signup}
            initialData={props.initialData}
            isBusTrip={props.isBusTrip}
            minimal={props.minimal}
            section={props.section}
            compact={props.compact}
        />
    );
}
