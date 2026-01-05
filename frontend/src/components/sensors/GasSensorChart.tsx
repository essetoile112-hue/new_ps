import React, { useEffect, useState } from 'react';
import { useLatestSensor, useTodaySensorData, useHourlySensorData, transformSensorReadingsToChartData, useHistorySensor, useSensorReadings } from '../../hooks/useSensorData';
import { AreaChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Bar, Legend } from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { getDatabase, ref as dbRef, get } from 'firebase/database';

// Default demo chart data
// Default demo chart data
const DEMO_CHART_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  co: 30 + Math.sin(i / 6) * 20 + Math.random() * 5,
  timestamp: Date.now() - (24 - i) * 3600000,
  fullTime: `${new Date().toISOString().split('T')[0]} ${String(i).padStart(2, '0')}:00:00`,
}));

const generateTicks = (max: number) => {
  let step = 8;
  // Adjust step if max is large to avoid too many ticks
  if (max > 640) step = 64;
  else if (max > 320) step = 32;
  else if (max > 160) step = 16;
  else if (max > 80) step = 8;

  const ticks = [];
  // Ensure we cover up to max + step to leave some headroom
  for (let i = 0; i * step <= max + step; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

interface GasSensorChartProps {
  height?: number | string;
}

/**
 * Display latest gas sensor reading with status
 */
export const LatestSensorCard: React.FC = () => {
  const { latest, loading, error } = useLatestSensor();

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !latest) {
    return (
      <div className="p-4 bg-red-50 rounded-lg shadow border border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          <span className="text-sm">Sensor data unavailable</span>
        </div>
      </div>
    );
  }

  // Determine status based on CO/Methane levels
  let status = 'Good';
  let statusColor = 'text-green-600';
  if (latest.value > 100) {
    status = 'Alert';
    statusColor = 'text-red-600';
  } else if (latest.value > 50) {
    status = 'Warning';
    statusColor = 'text-yellow-600';
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">Latest Gas Reading</span>
        <span className={`text-xs font-semibold ${statusColor}`}>{status}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-800">{latest.value.toFixed(1)}</span>
        <span className="text-sm text-gray-600">{latest.unit}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {latest.time} | {latest.date}
      </div>

      {/* DHT22 readings (temperature + humidity) */}
      {(latest.temperature !== undefined || latest.humidity !== undefined) && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
          <div>
            <div className="text-xs text-gray-500">Température</div>
            <div className="font-semibold">{latest.temperature != null ? `${latest.temperature.toFixed(1)} °C` : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Humidité</div>
            <div className="font-semibold">{latest.humidity != null ? `${latest.humidity.toFixed(1)} %` : '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Display today's gas sensor data trends with real-time updates
 * Shows: All historical data + real-time updates
 * Logic: If gaz_detecte=true, show value; if gaz_detecte=false, curve drops to 0
 */
export const TodayGasSensorChart: React.FC<GasSensorChartProps> = ({ height = 350 }) => {
  const { latest } = useLatestSensor();
  const [chartData, setChartData] = useState < any[] > ([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState < number > (Date.now());

  // Update every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load ALL historical data from localStorage + real-time updates
  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      let allData = [];

      try {
        // Try to load from Firebase history_by_day first (same as Dashboard)
        try {
          const db = getDatabase();
          const ref = dbRef(db, `capteur_gaz/history_by_day/${today}`);
          const snapshot = await get(ref);
          if (snapshot.exists() && snapshot.val().readings) {
            const readings = snapshot.val().readings;
            console.log('📦 Loading', readings.length, 'readings for today from Firebase history_by_day');
            allData = [...readings];
          }
        } catch (fbErr) {
          console.warn('⚠️ Firebase history_by_day load failed:', fbErr);
          // Fallback to localStorage
          const stored = localStorage.getItem('u4_sensor_history');
          if (stored) {
            const storedReadings = JSON.parse(stored);
            const todayReadings = storedReadings.filter((r) => {
              const readingDate = r.date || new Date(r.timestamp).toISOString().split('T')[0];
              return readingDate === today;
            });
            console.log('📦 Loading', todayReadings.length, 'readings for today from localStorage (total:', storedReadings.length, ')');
            allData = [...todayReadings];
          }
        }
      } catch (e) {
        console.error('❌ localStorage error:', e);
      }

      // If NO data at all, use latest as single point
      if (allData.length === 0 && latest) {
        console.log('ℹ️ No historical data, using current reading');
        allData = [latest];
      }

      if (allData.length === 0) {
        console.warn('❌ No data available');
        setLoading(true);
        setChartData([]);
        return;
      }

      setLoading(false);

      // Update/add real-time data for current minute
      // Logic: If gaz_detecte=false, curve drops to 0; if true, use real value
      if (latest?.timestamp) {
        const now = new Date();
        const currentMinStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0).getTime();
        const currentMinEnd = currentMinStart + 60000;

        // Remove any existing reading from current minute
        allData = allData.filter(r => !(r.timestamp >= currentMinStart && r.timestamp < currentMinEnd));

        // Add current minute with gas_detecte logic
        const currentValue = latest.gaz_detecte ? (latest.value || 0) : 0;
        allData.push({
          ...latest,
          value: currentValue,
        });

        console.log('🔄 RT update. Value:', currentValue, 'gaz_detecte:', latest.gaz_detecte);
      }

      // ------------------------------------------------------------------
      // Resample logic: Fill gaps with 0 for every minute without data
      // ------------------------------------------------------------------
      if (allData.length > 0) {
        // OPTIMIZATION: If only 1 data point (e.g., just the latest), skip resampling
        if (allData.length === 1) {
          console.log('📍 Single data point, skipping resampling');
          const transformed = transformSensorReadingsToChartData(allData);
          setChartData(transformed);
          return;
        }

        // 1. Sort data by timestamp
        allData.sort((a, b) => a.timestamp - b.timestamp);

        // 2. Define range: Start of first hour with data -> Current Time/End of last hour
        // However, user specifically asked for "minutes of historical hours".
        // Safest is to go from the first data point's hour start to current time.
        const firstTs = allData[0].timestamp;
        const lastTs = Math.max(Date.now(), allData[allData.length - 1].timestamp); // Ensure we go up to now

        // SAFETY: Limit to 24 hours max to prevent browser freeze
        const MAX_HOURS = 24;
        const maxRange = MAX_HOURS * 60 * 60 * 1000; // 24 hours in ms
        const safeFirstTs = Math.max(firstTs, lastTs - maxRange);

        // Round down to nearest minute
        const startMinute = Math.floor(safeFirstTs / 60000) * 60000;
        const endMinute = Math.ceil(lastTs / 60000) * 60000;

        const totalMinutes = (endMinute - startMinute) / 60000;
        console.log(`📊 Resampling range: ${totalMinutes} minutes (${(totalMinutes / 60).toFixed(1)} hours)`);

        // SAFETY CHECK: If range is still too large, skip resampling
        if (totalMinutes > MAX_HOURS * 60) {
          console.warn('⚠️ Time range too large, using data as-is without resampling');
          const transformed = transformSensorReadingsToChartData(allData);
          setChartData(transformed);
          return;
        }

        const resampledData = [];
        let inputIdx = 0;

        // Iterate minute by minute
        for (let time = startMinute; time <= endMinute; time += 60000) {
          // Find if there is any reading within this minute window [time, time + 60s)
          // We look ahead in the sorted input array
          let foundReading = null;

          // Advance inputIdx past any readings older than the current minute
          while (inputIdx < allData.length && allData[inputIdx].timestamp < time) {
            inputIdx++;
          }

          // Check for readings within the current minute
          let currentMinuteReadings = [];
          let tempIdx = inputIdx;
          while (tempIdx < allData.length && allData[tempIdx].timestamp >= time && allData[tempIdx].timestamp < time + 60000) {
            currentMinuteReadings.push(allData[tempIdx]);
            tempIdx++;
          }

            if (currentMinuteReadings.length > 0) {
            // Take the last reading in the minute as representative
            foundReading = currentMinuteReadings[currentMinuteReadings.length - 1];
          }

          if (foundReading) {
            // Use the actual reading
            resampledData.push({
              ...foundReading,
              time: new Date(time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              timestamp: time // normalize to minute start for cleaner X-axis
            });
          } else {
            // No reading for this minute -> Value is 0
            // "courbe doit tendre vers 0"
            resampledData.push({
              date: today,
              time: new Date(time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              value: 0,
              co: 0, // Ensure specific key is 0
              timestamp: time,
              unit: 'ppm',
              sensor_type: 'MQ-5',
              temperature: null,
              humidity: null,
              sensor_connected: true,
              gaz_detecte: false // Implicitly false
            });
          }
        }

        console.log('📉 Resampled chart points:', resampledData.length);
        const transformed = transformSensorReadingsToChartData(resampledData);
        setChartData(transformed);
      } else {
        setChartData([]);
      }
    })();
  }, [latest?.timestamp, latest?.gaz_detecte, latest?.value, currentTime]);

  if (loading && chartData.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-lg" style={{ height }}>
        <div className="h-full bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Loading historical data...</div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-lg" style={{ height }}>
        <div className="h-full bg-gray-50 rounded flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <p className="text-sm">No sensor readings available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-lg">
      <div style={{ height: (height as number) - 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              tick={{ fontSize: 12 }}
              tickFormatter={(ts) => {
                try {
                  const d = new Date(ts);
                  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                } catch { return ''; }
              }}
            />
            <YAxis
              label={{ value: 'CO (ppm)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              labelFormatter={(value: any) => {
                try {
                  const timestamp = Number(value);
                  if (timestamp > 1000000000000) {
                    const d = new Date(timestamp);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    const seconds = String(d.getSeconds()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                  }
                } catch (e) {
                  console.error('Tooltip format error:', e);
                }
                return String(value);
              }}
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return value.toFixed(2);
                }
                return value;
              }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px 12px'
              }}
              cursor={{ stroke: 'rgba(0, 0, 0, 0.2)', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="co"
              stroke="#10b981"
              fill="url(#gasGradient)"
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Display hourly aggregated gas sensor data
 */
export const HourlyGasSensorChart: React.FC<GasSensorChartProps> = ({ height = 280 }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { data, loading, error } = useHourlySensorData(date);

  if (loading) {
    return (
      <div className="glass-panel p-4 rounded-lg" style={{ height }}>
        <div className="h-full bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !data?.hourly_data) {
    return (
      <div className="glass-panel p-4 rounded-lg border border-red-200" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-600 text-xs">Failed to load hourly data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 rounded-lg hover:shadow-lg transition-transform duration-300 cursor-pointer hover-float hover-tilt hover-shine" style={{ height }}>
      <div className="text-sm mb-2 card-title">Hourly Gas Levels</div>
      <div style={{ height: (height as number) - 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.hourly_data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: any) => value.toFixed(2)} />
            <Bar dataKey="average" fill="#10b981" name="Avg (ppm)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Date: {date} | {data.hourly_data.length} hourly readings
      </div>
    </div>
  );
};

/**
 * Mini status widget showing current sensor status
 */
export const GasSensorStatusWidget: React.FC = () => {
  const { latest, loading } = useLatestSensor();

  if (loading) {
    return (
      <div className="p-3 bg-white rounded-md shadow-inner animate-pulse">
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="p-3 bg-red-50 rounded-md shadow-inner border border-red-200">
        <span className="text-xs text-red-600">No sensor data</span>
      </div>
    );
  }

  // Determine color based on thresholds
  let bgColor = 'bg-green-50';
  let borderColor = 'border-green-200';
  let textColor = 'text-green-700';
  let label = 'Good';

  if (latest.value > 100) {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    textColor = 'text-red-700';
    label = 'Critical';
  } else if (latest.value > 50) {
    bgColor = 'bg-yellow-50';
    borderColor = 'border-yellow-200';
    textColor = 'text-yellow-700';
    label = 'Warning';
  }

  return (
    <div className={`p-3 ${bgColor} rounded-md shadow-inner border ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">CO/Methane Level</div>
        <div className={`text-xs font-bold ${textColor}`}>{label}</div>
      </div>
      <div className={`text-2xl font-bold ${textColor} mt-1`}>
        {latest.value.toFixed(1)} <span className="text-sm">ppm</span>
      </div>
      <div className="mt-2 text-xs text-gray-600">Last: {latest.time}</div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-gray-500">Température</div>
          <div className="font-semibold">{latest.temperature != null ? `${latest.temperature.toFixed(1)} °C` : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Humidité</div>
          <div className="font-semibold">{latest.humidity != null ? `${latest.humidity.toFixed(1)} %` : '—'}</div>
        </div>
      </div>

      <div className="mt-3 text-sm grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-gray-500">Capteur</div>
          <div className={`font-semibold ${latest.sensor_connected ? 'text-green-700' : 'text-red-600'}`}>{latest.sensor_connected ? 'Connecté' : 'Déconnecté'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Gaz détecté</div>
          <div className={`font-semibold ${latest.gaz_detecte ? 'text-red-700' : 'text-green-700'}`}>{latest.gaz_detecte ? 'Oui' : 'Non'}</div>
        </div>
      </div>
    </div>
  );
};
