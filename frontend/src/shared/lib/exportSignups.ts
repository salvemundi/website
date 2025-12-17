/**
 * Export signups to an Excel file. Uses SheetJS (xlsx) if present, otherwise falls back to CSV.
 */
interface ExportSignup {
    id?: number | string;
    participant_name?: string;
    participant_email?: string;
    participant_phone?: string;
    checked_in?: boolean;
    checked_in_at?: string;
    created_at?: string;
    directus_relations?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
    };
}

export default async function exportEventSignups(signups: ExportSignup[], filename = 'aanmeldingen.xlsx') {
    // Normalize rows
    const rows = signups.map((s) => ({
        id: s.id,
        name: s.participant_name || (s.directus_relations?.first_name ? `${s.directus_relations.first_name} ${s.directus_relations.last_name || ''}`.trim() : ''),
        email: s.participant_email || s.directus_relations?.email || '',
        phone: s.participant_phone || s.directus_relations?.phone_number || '',
        checked_in: s.checked_in ? 'Ja' : 'Nee',
        checked_in_at: s.checked_in_at || '',
        created_at: s.created_at || ''
    }));

    // Export as CSV (XLSX support removed to avoid build errors when 'xlsx' package not installed)
    // To enable XLSX: install 'xlsx' package and uncomment the try/catch block above
    const header = Object.keys(rows[0] || {}).join(',') + '\n';
    const csv = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.xlsx$/, '.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
}
