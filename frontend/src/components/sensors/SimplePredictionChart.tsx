import React from 'react';
import { ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SimplePredictionChartProps {
  historicalData?: Array<{ time: string; co: number; timestamp?: number }>;
  height?: number | string;
}

/**
 * Simplified prediction chart without controls - shows only the graph
 * This component displays historical CO data and can be extended for predictions
 */
export const SimplePredictionChart: React.FC<SimplePredictionChartProps> = ({
  historicalData = [],
  height = 320
}) => {
  // Use historical data directly for now
  const chartData = historicalData.map((h) => ({
    ...h,
    predicted: null,
    type: 'historical',
  }));

  return (
    <div className="w-full h-full">
      <div style={{ height: height as number }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                try {
                  // If value is a timestamp number, convert to HH:MM format
                  if (typeof value === 'number' && value > 1000000000000) {
                    const date = new Date(value);
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${hours}:${minutes}`;
                  }
                  // If it's already a time string like "15:46", use first 5 chars
                  if (typeof value === 'string') {
                    return value.substring(0, 5);
                  }
                  return String(value);
                } catch {
                  return String(value);
                }
              }}
            />
            <YAxis
              label={{ value: 'CO (ppm)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc' }}
              formatter={(value: any) =>
                typeof value === 'number' ? value.toFixed(2) : 'N/A'
              }
              labelFormatter={(label: any) => {
                try {
                  // If label is a timestamp number, format it
                  if (typeof label === 'number') {
                    return new Date(label).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });
                  }
                  // Otherwise return the label as is (time string like "15:46")
                  return label;
                } catch {
                  return String(label);
                }
              }}
            />

            {/* Historical Data */}
            <Area
              type="monotone"
              dataKey="co"
              stroke="#10b981"
              fill="url(#predictionGradient)"
              isAnimationActive={true}
            />

            {/* Predicted Data - will be added later */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SimplePredictionChart;
