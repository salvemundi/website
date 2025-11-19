import * as XLSX from 'xlsx';

type Signup = any;

export default function exportEventSignups(signups: Signup[], filename = 'signups.xlsx') {
  try {
    // Map signups to rows
    const rows = signups.map(s => {
      const user = s.directus_relations || s.directus_relations?.[0] || s.directus_relations;
      const first = user?.first_name || (user && user[0]?.first_name) || '';
      const last = user?.last_name || (user && user[0]?.last_name) || '';
      const email = user?.email || (user && user[0]?.email) || '';
      const phone = user?.phone_number || (user && user[0]?.phone_number) || '';

      return {
        'Voornaam': first,
        'Achternaam': last,
        'Email': email,
        'Telefoon': phone,
        'Aangemeld op': s.created_at || s.date_created || '',
        'Ingecheckt': s.checked_in ? 'Ja' : 'Nee',
        'Ingecheckt op': s.checked_in_at || '',
        'QR token': s.qr_token || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aanmeldingen');

    // Trigger download in browser
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Failed to export signups to Excel', error);
    throw error;
  }
}
