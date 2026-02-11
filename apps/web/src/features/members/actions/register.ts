'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';


// Schema validation
const RegisterSchema = z.object({
    firstName: z.string().min(2, "Voornaam is verplicht"),
    lastName: z.string().min(2, "Achternaam is verplicht"),
    email: z.string().email("Ongeldig e-mailadres"),
    dateOfBirth: z.string().optional(),
});

/**
 * Server Action: Register Member
 * Securely communicates with the Identity Service using Zero Trust principles.
 */
export async function registerMember(_prevState: any, formData: FormData) {
    const correlationId = uuidv4();

    // 1. Validation
    const validatedFields = RegisterSchema.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        dateOfBirth: formData.get('dateOfBirth'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validatie mislukt",
            details: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { firstName, lastName, email, dateOfBirth } = validatedFields.data;

    try {
        // 2. Security: Traceability


        console.log(`[${correlationId}] 🚀 Initiating member registration for: ${email}`);

        // 3. Request to Internal Identity Service
        // Note: 'identity' is the Docker service name in the service-mesh network
        const identityUrl = process.env.IDENTITY_SERVICE_URL || 'http://identity:8000';
        const response = await fetch(`${identityUrl}/api/membership/create-user`, {
            method: 'POST',
            headers: {
                'x-internal-api-secret': process.env.SERVICE_SECRET || '',
                'X-Correlation-ID': correlationId,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                personal_email: email,
                date_of_birth: dateOfBirth,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Identity Service registration failed');
        }

        const result = await response.json();

        console.log(`[${correlationId}] ✅ Successfully registered member: ${email}`);

        return {
            success: true,
            message: "Lidmaatschap succesvol aangevraagd.",
            userId: result.id
        };

    } catch (error: any) {
        console.error(`[${correlationId}] ❌ Registration Error:`, error.message);
        return {
            error: "Er is een fout opgetreden bij het registreren. Probeer het later opnieuw.",
        };
    }
}
