import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Exports data to a CSV file and triggers a download in the browser.
 * @param data Array of objects to export
 * @param filename Desired filename
 */
export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) return;

    // Extract headers
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Format value: handle strings with commas, dates, etc.
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // Create blob and download
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Exports data to an Excel file (.xlsx)
 */
export function exportToExcel(data: any[], filename: string) {
    if (!data || !data.length) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historique');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exports data to a professional PDF file
 */
export function exportToPDF(data: any[], filename: string) {
    if (!data || !data.length) return;

    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    const rows = data.map(item => Object.values(item));

    // Logo (if available) - skipping for simplicity or using text
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text('SIGFA - Rapport d\'Activité', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);

    (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 35,
        theme: 'striped',
        headStyles: { fillStyle: '#2f3640', textColor: 255 },
        alternateRowStyles: { fillStyle: '#f5f6fa' },
    });

    doc.save(`${filename}.pdf`);
}
