import React from 'react';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export const ExportButtons = ({ data }: { reportRef?: React.RefObject<HTMLElement>; data?: any[] }) => {

  const handleCSV = () => {
    if (data) exportToCSV(data, 'u4-green-data');
  };

  const handlePDF = () => {
    if (data) exportToPDF(data, 'u4-green-report');
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleCSV} className="btn-emerald-outline flex items-center gap-2">
        <span>CSV</span>
      </button>
      <button onClick={handlePDF} className="btn-emerald-outline flex items-center gap-2">
        <span>PDF</span>
      </button>
    </div>
  );
};

export default ExportButtons;
