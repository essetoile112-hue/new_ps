import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';

export const PredictionChart = ({ data }: { data: any[] }) => {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any[] | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setForecast(null);
    await new Promise(r => setTimeout(r, 2500));
    // simple fake forecast: last values + small increase
    const last = data.slice(-7).map((d: any, i: number) => ({ ...d, time: `F${i}` }));
    const f = last.map((d: any, i: number) => ({ ...d, pm25: Math.round((d.pm25 + 1.5 + i * 0.6) * 10) / 10 }));
    setForecast(f);
    setLoading(false);
  };

  return (
    <div className="glass-panel p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-muted-foreground">AI Prediction</div>
          <div className="text-lg font-semibold">Predict Pollution (7 Days)</div>
        </div>
        <div>
          <button onClick={handlePredict} className={`btn-emerald`}>{loading ? 'Analyzing...' : 'Predict'}</button>
        </div>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="pm25" stroke="var(--primary)" fill="linear-gradient(180deg, rgba(16,185,129,0.14), rgba(16,185,129,0.02))" />
            {forecast && forecast.map((f, idx) => (
              <Line key={idx} type="monotone" data={forecast} dataKey="pm25" stroke="#065f46" strokeDasharray="4 4" dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {forecast && <div className="mt-3 text-sm text-gray-700">Confidence: <strong>87%</strong></div>}
    </div>
  );
};

export default {};
