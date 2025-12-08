/**
 * Export signups to an Excel file. Uses SheetJS (xlsx) if present, otherwise falls back to CSV.
 */
export default async function exportEventSignups(signups: any[], filename = 'aanmeldingen.xlsx') {
    // Normalize rows
    const rows = signups.map(s => ({
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
