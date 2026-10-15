export function downloadCSV(data: { [key: string]: unknown }[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);

    const escapeCSVValue = (val: unknown) => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
            str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const rowMap = new Map(Object.entries(row));
        const values = headers.map(header => escapeCSVValue(rowMap.get(header)));
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');

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
