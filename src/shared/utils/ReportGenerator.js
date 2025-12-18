import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const ReportGenerator = {
    // Export to Excel
    exportToExcel: (data, columns, filename = 'report.xlsx') => {
        // match data to columns map
        const exportData = data.map(item => {
            const row = {};
            columns.forEach(col => {
                // Handle nested properties if needed, for now flat
                row[col.label] = item[col.key] || '-';
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // RTL direction for sheet (optional, Excel handles it by user setting mainly)
        if (!worksheet['!views']) worksheet['!views'] = [];
        worksheet['!views'].push({ rightToLeft: true });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        XLSX.writeFile(workbook, filename);
    },

    // Export to PDF
    exportToPDF: async (data, columns, filename = 'report.pdf', title = 'تقرير النظام') => {
        const doc = new jsPDF();

        // Note: Standard jsPDF does not support Arabic text correctly (RTL and joining) without a custom font.
        // For this prototype, we will attempt to use a standard font or warn.
        // To properly support Arabic, we would need to load a base64 font like Amiri.
        // We will try to add a basic font if possible, or rely on English keys if Arabic fails rendering.

        // Header
        doc.setFontSize(18);
        doc.text(title, 105, 20, { align: 'center' }); // Text might be reversed without font
        doc.setFontSize(10);
        doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, 105, 30, { align: 'center' });

        // Table
        const tableColumn = columns.map(c => c.label).reverse(); // Reverse for RTL visual trick if needed? No, AutoTable supports styles.
        const tableRows = [];

        data.forEach(item => {
            const rowData = columns.map(col => item[col.key] || '-');
            // rowData.reverse(); // If using RTL layout manually
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [columns.map(c => c.label)], // Standard order
            body: tableRows,
            startY: 40,
            styles: {
                fontSize: 10,
                halign: 'right', // Right align for Arabic
                font: 'helvetica' // Will need replacement for Arabic
            },
            headStyles: {
                fillColor: [66, 133, 244],
                halign: 'right'
            },
            theme: 'grid'
        });

        doc.save(filename);
    }
};
