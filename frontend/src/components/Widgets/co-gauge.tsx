import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CoGaugeProps {
  value: number;
  maxValue?: number;
}

export const CoGaugeWidget: React.FC<CoGaugeProps> = ({ value, maxValue = 100 }) => {
  // Normalize value for the gauge (0 to 1)
  const normalizedValue = Math.min(Math.max(value, 0), maxValue);

  // Data for the gauge: [value, remaining]
  const data = [
    { name: 'Value', value: normalizedValue },
    { name: 'Remaining', value: maxValue - normalizedValue },
  ];

  // Colors: Green -> Yellow -> Red based on value
  let color = '#10b981'; // Green
  let status = 'Excellent';

  if (value > 15) {
    color = '#ef4444'; // Red
    status = 'Danger';
  } else if (value > 8) {
    color = '#f59e0b'; // Yellow
    status = 'Attention';
  }

  // Grey for the remaining part
  const colors = [color, '#e2e8f0'];

  // Needle angle calculation (180 degrees span)
  // 180 degrees is start, 0 is end. 
  // We want startAngle={180} endAngle={0}
  // This constructs a semi-circle. 
  // Recharts Pie startAngle 180 is left (9 o'clock), 0 is right (3 o'clock).

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="w-full h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cy="70%"
              innerRadius="60%"
              outerRadius="80%"
              startAngle={180}
              endAngle={0}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Value Display in Center */}
        <div className="absolute left-0 right-0 bottom-[30%] flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-slate-800 animate-in fade-in zoom-in duration-500">
            {value.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">ppm</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`mt-[-20px] px-4 py-1 rounded-full text-sm font-bold shadow-sm border ${status === 'Danger' ? 'bg-red-50 text-red-600 border-red-100' :
          status === 'Attention' ? 'bg-amber-50 text-amber-600 border-amber-100' :
            'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
        {status}
      </div>

      <div className="mt-4 w-full px-8">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>0</span>
          <span>{maxValue / 2}</span>
          <span>{maxValue}+</span>
        </div>
      </div>
    </div>
  );
};
