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

    try {
        // Only attempt to import SheetJS on the client. During Next.js server build/SSR the
        // `window` is not available and we should not try to resolve the 'xlsx' package.
        if (typeof window === 'undefined') throw new Error('Server environment - skip xlsx');
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aanmeldingen');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return true;
    } catch (err) {
        console.warn('SheetJS not available, falling back to CSV', err);
        // CSV fallback
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
}
