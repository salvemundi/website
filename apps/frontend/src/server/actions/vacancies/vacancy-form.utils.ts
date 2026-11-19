export function parseJsonArray(value: FormDataEntryValue | null): string[] {
    if (typeof value !== 'string' || !value) return [];
    try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
        return [];
    }
}

export interface VacancyFormBaseFields {
    title: FormDataEntryValue | null;
    company: FormDataEntryValue | null;
    description: FormDataEntryValue | null;
    type: FormDataEntryValue | null;
    contact_email: FormDataEntryValue | null;
    contact_phone: FormDataEntryValue | null;
    contact_website: FormDataEntryValue | null;
    location: FormDataEntryValue | null;
    salary: FormDataEntryValue | null;
    employment_type: FormDataEntryValue | null;
    working_hours: FormDataEntryValue | null;
    directions: string[];
    skills: string[];
}

export function extractBaseVacancyFormFields(formData: FormData): VacancyFormBaseFields {
    return {
        title: formData.get('title'),
        company: formData.get('company'),
        description: formData.get('description'),
        type: formData.get('type'),
        contact_email: formData.get('contact_email'),
        contact_phone: formData.get('contact_phone'),
        contact_website: formData.get('contact_website'),
        location: formData.get('location'),
        salary: formData.get('salary'),
        employment_type: formData.get('employment_type'),
        working_hours: formData.get('working_hours'),
        directions: parseJsonArray(formData.get('directions')),
        skills: parseJsonArray(formData.get('skills')),
    };
}

export function extractOptionalFile(entry: FormDataEntryValue | null): File | null {
    if (typeof File !== 'undefined' && entry instanceof File) {
        return entry;
    }
    return null;
}

export function extractVacancyAttachments(formData: FormData): {
    imageFile: File | null;
    documentFile: File | null;
} {
    return {
        imageFile: extractOptionalFile(formData.get('imageFile')),
        documentFile: extractOptionalFile(formData.get('documentFile')),
    };
}
