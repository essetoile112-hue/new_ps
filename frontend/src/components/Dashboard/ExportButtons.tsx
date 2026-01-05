import React from 'react';

export function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ onExportCSV }: { onExportCSV: () => void }) {
  const exportPDF = () => {
    // Open printable view in a new window and let user save as PDF
    const printWindow = window.open('', '_blank', 'noopener');
    if (!printWindow) return;
    const html = document.querySelector('#dashboard-root')?.innerHTML || document.body.innerHTML;
    printWindow.document.write('<html><head><title>Dashboard export</title>');
    printWindow.document.write('<style>body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto; padding:20px; background:#fff; color:#064e3b}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(html);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    // give time to render
    setTimeout(() => printWindow.print(), 600);
  };

  return (
    <div className="flex gap-2">
      <button onClick={onExportCSV} className="px-3 py-2 bg-emerald-600 text-white rounded shadow">Export CSV</button>
      <button onClick={exportPDF} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Export PDF</button>
    </div>
  );
}
