import React, { useEffect, useMemo, useRef } from 'react';

type Point = { x: string; y: number };

const padding = 24;

export default function LineChart({ data, height = 160 }: { data: Point[]; height?: number }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = Math.max(300, data.length * 24 + padding * 2);

  const path = useMemo(() => {
    if (!data.length) return '';
    const max = Math.max(...data.map((d) => d.y));
    const min = Math.min(...data.map((d) => d.y));
    const range = Math.max(1, max - min);
    return data
      .map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2);
        const y = padding + ((max - d.y) / range) * (height - padding * 2);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [data, width, height]);

  useEffect(() => {
    const el = svgRef.current?.querySelector('path');
    if (!el) return;
    const length = (el as SVGPathElement).getTotalLength();
    el.setAttribute('stroke-dasharray', `${length}`);
    el.setAttribute('stroke-dashoffset', `${length}`);
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.4s ease-out';
      el.setAttribute('stroke-dashoffset', '0');
    });
  }, [path]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width={width} height={height} className="block">
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#047857" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* area fill */}
        <path d={`${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="url(#g1)" opacity={0.6} />
        {/* x labels */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - padding * 2);
          return (
            <text key={i} x={x} y={height - 6} fontSize={10} textAnchor="middle" fill="#065f46">
              {d.x}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
