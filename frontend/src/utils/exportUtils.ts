import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DataItem {
  timestamp?: number | string;
  date?: string;
  time?: string;
  co?: number;
  temperature?: number;
  humidity?: number;
  [key: string]: any;
}



/**
 * Export data to CSV
 */
export const exportToCSV = (data: DataItem[], filename = 'u4-green-export') => {
  if (!data || data.length === 0) return;

  // Define columns
  const headers = ['Date', 'Heure', 'CO (ppm)', 'Température (°C)', 'Humidité (%)'];

  // Use semicolon for Excel compatibility in French regions
  const separator = ';';

  const csvContent = [
    headers.join(separator),
    ...data.map((row) => {
      const ts = row.timestamp ? new Date(row.timestamp) : new Date();
      return [
        ts.toLocaleDateString('fr-FR'),
        ts.toLocaleTimeString('fr-FR'),
        (row.co || 0).toFixed(2).replace('.', ','), // Use comma for decimals in French Excel
        (row.temperature || 0).toFixed(1).replace('.', ','),
        (row.humidity || 0).toFixed(1).replace('.', ','),
      ].join(separator);
    }),
  ].join('\n');

  // Add BOM (\uFEFF) so Excel recognizes UTF-8 encoding (fixes accents like é/°)
  const blobWithBOM = '\uFEFF' + csvContent;

  downloadFile(blobWithBOM, 'text/csv;charset=utf-8;', `${filename}.csv`);
};

/**
 * Export data to JSON
 */
export const exportToJSON = (data: DataItem[], filename = 'u4-green-export') => {
  if (!data || data.length === 0) return;
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, 'application/json', `${filename}.json`);
};

/**
 * Export data to professional PDF
 */
export const exportToPDF = (data: DataItem[], filename = 'u4-green-report') => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // --- Header ---
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('U4 Green Africa', 14, 25);

  doc.setFontSize(12);
  doc.text('Rapport Environnemental', pageWidth - 14, 25, { align: 'right' });

  // --- Metadata ---
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleString('fr-FR');
  doc.text(`Généré le: ${dateStr}`, 14, 50);
  doc.text(`Nombre de relevés: ${data.length}`, 14, 60);

  // --- Summary Stats ---
  const validCo = data.map(d => d.co || 0);
  const avgCo = (validCo.reduce((a, b) => a + b, 0) / validCo.length).toFixed(2);
  const maxCo = Math.max(...validCo).toFixed(2);

  doc.text(`CO Moyen: ${avgCo} ppm`, pageWidth / 2, 50);
  doc.text(`CO Max: ${maxCo} ppm`, pageWidth / 2, 60);

  // --- Table ---
  const tableColumn = ["Date", "Heure", "CO (ppm)", "Temp (°C)", "Hum (%)"];
  const tableRows = data.map(row => {
    const ts = row.timestamp ? new Date(row.timestamp) : new Date();
    return [
      ts.toLocaleDateString('fr-FR'),
      ts.toLocaleTimeString('fr-FR'),
      (row.co || 0).toFixed(2),
      (row.temperature || 0).toFixed(1),
      (row.humidity || 0).toFixed(1)
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 244] }, // light emerald
  });

  // --- Footer ---
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} sur ${pageCount} - U4 Green Africa IoT Platform`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
};

/**
 * Helper to trigger download
 */
const downloadFile = (content: string, type: string, filename: string) => {
  const blob = new Blob([content], { type });
  console.log('Downloading file:', filename, 'Size:', blob.size);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
