import React, { useMemo } from 'react';

export default function DonutChart({ parts = [] }: { parts: { label: string; value: number; color?: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  let acc = 0;
  const segments = parts.map((p) => {
    const from = acc;
    const percent = p.value / total;
    acc += percent;
    return { ...p, from, percent };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={120} height={120} viewBox="0 0 120 120">
        <g transform="translate(60,60)">
          {segments.map((s, i) => {
            const dash = `${(s.percent * circumference).toFixed(2)} ${((1 - s.percent) * circumference).toFixed(2)}`;
            const rotate = s.from * 360 - 90;
            return (
              <circle
                key={i}
                r={radius}
                cx={0}
                cy={0}
                fill="none"
                stroke={s.color || ['#10b981', '#34d399', '#a7f3d0'][i % 3]}
                strokeWidth={16}
                strokeDasharray={dash}
                strokeDashoffset={0}
                transform={`rotate(${rotate})`}
                style={{ transition: 'stroke-dasharray 0.9s ease' }}
              />
            );
          })}
          <circle r={32} fill="#f0fdf4" />
          <text x={0} y={4} textAnchor="middle" fill="#065f46" fontSize={14} fontWeight={700}>
            {Math.round(parts[0]?.value || 0)}%
          </text>
        </g>
      </svg>
      <div className="flex flex-col text-sm">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-emerald-800">
            <span style={{ width: 12, height: 12, background: p.color || '#34d399', display: 'inline-block', borderRadius: 3 }} />
            <span>{p.label}</span>
            <span className="ml-2 text-xs text-emerald-600">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
