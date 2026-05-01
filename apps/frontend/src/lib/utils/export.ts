/**
 * Secure CSV Export Utility
 * 
 * Replaces the heavy and vulnerable 'xlsx' library for simple table exports.
 * Standard CSV format (UTF-8 with BOM for Excel compatibility).
 */

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return;

    // 1. Extract headers from the first object
    const headers = Object.keys(data[0]);

    // 2. Escape values (handle commas, quotes, and newlines)
    const escapeCSVValue = (val: unknown) => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        // If the value contains quotes, commas, or newlines, wrap it in quotes and double the internal quotes
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
            str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    // 3. Build CSV string
    const csvRows: string[] = [];
    csvRows.push(headers.join(',')); // Add header row

    for (const row of data) {
        const values = headers.map(header => escapeCSVValue(row[header]));
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');

    // 4. Create Blob and download link
    // Adding UTF-8 BOM (\uFEFF) ensures Excel opens it with correct encoding
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
