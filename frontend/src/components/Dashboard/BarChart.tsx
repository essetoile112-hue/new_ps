import React, { useEffect } from 'react';

export default function BarChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-emerald-100 rounded-t transition-all duration-700"
            style={{ height: `${(d.value / max) * 100}%`, background: 'linear-gradient(180deg,#bbf7d0,#34d399)' }}
            title={`${d.value}`}
          />
          <div className="text-xs text-emerald-700 mt-2">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
