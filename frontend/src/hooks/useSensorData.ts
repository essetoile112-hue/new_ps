import { useEffect, useState, useRef } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { saveToHistoryByDay, initializeDay } from '../services/historyService';

// Auto-save interval (1 minute in ms)
const AUTO_SAVE_INTERVAL = 60000;

// Mock data for demonstration when Firebase is unavailable
const MOCK_SENSOR_READINGS: SensorReading[] = [
  ...Array.from({ length: 24 }, (_, i) => ({
    date: new Date().toISOString().split('T')[0],
    time: `${String(i).padStart(2, '0')}:00:00`,
    value: 30 + Math.sin(i / 6) * 20 + Math.random() * 5,
    timestamp: Date.now() - (24 - i) * 3600000,
    unit: 'ppm',
    sensor_type: 'MQ7/MQ9'
  }))
];

// Store readings in localStorage to persist across sessions
const STORAGE_KEY = 'u4_sensor_history';
const MAX_STORED_READINGS = 1440; // 24 hours of 1-minute readings

const getStoredReadings = (): SensorReading[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Fall through to default
  }

  // Return mock data if no stored readings
  return MOCK_SENSOR_READINGS;
};

const saveReadingToHistory = (reading: SensorReading) => {
  try {
    const stored = getStoredReadings();
    const updated = [reading, ...stored].slice(0, MAX_STORED_READINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save reading to history:', err);
  }
};

// Initialize localStorage with mock data on first load if empty
const initializeStorageIfEmpty = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('Initializing localStorage with mock data');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SENSOR_READINGS));
    } else {
      console.log('Found stored readings:', JSON.parse(stored).length);
    }
  } catch (err) {
    console.warn('Failed to initialize storage:', err);
  }
};

// Call on import
if (typeof window !== 'undefined') {
  initializeStorageIfEmpty();
}

export interface SensorReading {
  date: string;
  time: string;
  value: number;
  timestamp: number;
  unit: string;
  sensor_type: string;
  temperature?: number | null;
  humidity?: number | null;
  sensor_connected?: boolean;
  gaz_detecte?: boolean;
}

export interface SensorData {
  readings: SensorReading[];
  average: number;
  max: number;
  min: number;
  latest: SensorReading | null;
  loading: boolean;
  error: string | null;
}

// Normalize timestamps to milliseconds. Accept seconds (10-digit) or milliseconds.
const normalizeTimestamp = (ts: any): number => {
  if (ts === undefined || ts === null) return Date.now();
  const n = Number(ts);
  if (!Number.isFinite(n)) return Date.now();
  if (n < 1e12) return Math.floor(n * 1000);
  return Math.floor(n);
};

/**
 * Hook to fetch the latest sensor reading from Firebase
 * Uses two separate onValue listeners on capteur_gaz and dht nodes
 * Combines them into a single SensorReading output
 * Also saves readings to history_by_day automatically
 */
export const useLatestSensor = () => {
  // Cache keys
  const CACHE_GAS_KEY = 'u4_last_gas_data';
  const CACHE_DHT_KEY = 'u4_last_dht_data';

  // Initialize state from cache if available
  const [gasData, setGasData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem(CACHE_GAS_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  const [dhtData, setDhtData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem(CACHE_DHT_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false); // Start false if we have cache
  const [error, setError] = useState<string | null>(null);
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    // If no cache, we are loading
    if (!gasData && !dhtData) setLoading(true);
    const db = getDatabase();
    let loadedCount = 0;

    // Listen to capteur_gaz directly
    const gasRef = ref(db, 'capteur_gaz');
    const gasUnsub = onValue(
      gasRef,
      (snap: any) => {
        try {
          const val = snap.val();
          console.debug('🔥 Firebase capteur_gaz updated:', val);
          console.debug('  → concentration_relative:', val?.concentration_relative);
          console.debug('  → valeur_analogique:', val?.valeur_analogique);
          console.debug('  → gaz_detecte:', val?.gaz_detecte);
          setGasData(val);
          // Cache the new value
          localStorage.setItem(CACHE_GAS_KEY, JSON.stringify(val));
          setLoading(false); // Update immediately
        } catch (e) {
          console.error('❌ Error reading capteur_gaz:', e);
        }
      },
      (err: any) => {
        console.error('❌ capteur_gaz listener error:', err);
        setError(err?.message || 'RTDB error');
        setLoading(false);
      }
    );

    // Listen to dht node at root level (where ESP32 publishes  temperature and humidity)
    const dhtRef = ref(db, 'dht');
    const dhtUnsub = onValue(
      dhtRef,
      (snap: any) => {
        try {
          const val = snap.val();
          setDhtData(val);
          // Cache the new value
          localStorage.setItem(CACHE_DHT_KEY, JSON.stringify(val));
          // Don't need to wait for both, show partial data if available
          setLoading(false);
        } catch (e) {
          console.error('❌ Error reading dht:', e);
        }
      },
      (err: any) => {
        console.error('❌ dht listener error:', err);
        setError(err?.message || 'RTDB error');
        setLoading(false);
      }
    );

    return () => {
      try { gasUnsub(); } catch { }
      try { dhtUnsub(); } catch { }
    };
  }, []);

  // Combine gasData and dhtData into a single reading
  const latest: SensorReading | null = gasData || dhtData ? {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    // Prefer the calibrated concentration value (`concentration_relative`) over raw ADC
    value: gasData?.concentration_relative ?? gasData?.concentration ?? gasData?.valeur_analogique ?? gasData?.value ?? 0,
    timestamp: gasData?.timestamp ?? dhtData?.timestamp ?? Date.now(),
    unit: 'ppm',
    sensor_type: gasData?.sensor_type ?? 'MQ-5',
    temperature: dhtData?.temperature ?? null,
    humidity: dhtData?.humidity ?? null,
    sensor_connected: gasData?.sensor_connected ?? false,
    gaz_detecte: gasData?.gaz_detecte ?? false,
  } : null;

  // Also return dhtLatest for separate access to DHT values
  const dhtLatest = dhtData ? {
    temperature: dhtData?.temperature ?? null,
    humidity: dhtData?.humidity ?? null,
  } : null;

  // Log the chosen value for debugging display
  useEffect(() => {
    if (latest && latest.value !== undefined) {
      console.debug('✅ Display value chosen:', latest.value, 'ppm/% from:', {
        'concentration_relative (preferred)': gasData?.concentration_relative,
        'concentration (fallback)': gasData?.concentration,
        'valeur_analogique (last resort)': gasData?.valeur_analogique,
      });
    }
  }, [latest?.value, gasData]);

  // Auto-save to history_by_day (once per minute)
  useEffect(() => {
    if (!latest || !latest.value) return;

    const now = Date.now();
    if (now - lastSaveRef.current < AUTO_SAVE_INTERVAL) return;

    // Save to Firebase history_by_day
    saveToHistoryByDay({
      value: latest.value,
      temperature: latest.temperature,
      humidity: latest.humidity,
      gaz_detecte: latest.gaz_detecte,
      sensor_connected: latest.sensor_connected,
    }).then(() => {
      lastSaveRef.current = now;
      // Initialize day metadata
      initializeDay(latest.date);
    }).catch(err => {
      console.error('Failed to save to history_by_day:', err);
    });
  }, [latest?.timestamp]);

  return { latest, loading, error, dhtLatest, gasData, dhtData };
};

/**
 * Hook to subscribe to the RTDB history node `/history/capteur_gaz`
 * Returns stored readings (merged into localStorage) so charts can use them.
 */
export const useHistorySensor = () => {
  const [readings, setReadings] = useState<SensorReading[]>(() => getStoredReadings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getDatabase();
    const historyRef = ref(db, 'history');

    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        try {
          const raw = snapshot.val();
          const allValues: SensorReading[] = [];

          if (raw && typeof raw === 'object') {
            Object.entries(raw).forEach(([, node]: [string, any]) => {
              if (typeof node === 'object' && node !== null) {
                // If node is an array/map of readings
                if (typeof node === 'object') {
                  Object.entries(node).forEach(([, reading]: [string, any]) => {
                    if (typeof reading === 'object' && reading !== null) {
                      const ts = normalizeTimestamp(reading.timestamp ?? reading.t ?? 0);
                      const val = Number(reading.value ?? reading.v ?? 0);
                      const temp = Number(reading.temperature ?? reading.temp ?? null);
                      const hum = Number(reading.humidity ?? reading.hum ?? null);

                      allValues.push({
                        date: new Date(ts).toISOString().split('T')[0],
                        time: new Date(ts).toLocaleTimeString('en-US', { hour12: false }),
                        value: val,
                        timestamp: ts,
                        unit: 'ppm',
                        sensor_type: 'MQ-5',
                        temperature: Number.isFinite(temp) ? temp : null,
                        humidity: Number.isFinite(hum) ? hum : null,
                      });
                    }
                  });
                }
              }
            });
          }

          // Sort by timestamp descending, limit to latest 1440 readings (24h @ 1min interval)
          const sorted = allValues
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_STORED_READINGS);

          setReadings(sorted);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        } catch (err) {
          console.error('Error processing history snapshot:', err);
          setError('Failed to load history');
        }

        setLoading(false);
      },
      (err) => {
        console.error('History listener error:', err);
        setError(err?.message ?? 'Failed to connect to history');
        setLoading(false);
      }
    );

    return () => {
      try { unsubscribe(); } catch (e) {
        try { off(historyRef); } catch { }
      }
    };
  }, []);

  return { readings, loading, error };
};

/**
 * Hook to get all sensor readings for a specific date
 */
export const useTodaySensorData = () => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Get from localStorage first
    const stored = getStoredReadings();
    const todayReadings = stored.filter((r) => r.date === today);
    setReadings(todayReadings);
    setLoading(false);
  }, [today]);

  return { readings, loading, error };
};

/**
 * Hook to get aggregated sensor readings with statistics
 */
export const useSensorReadings = (limit: number = 100) => {
  const { readings, loading, error } = useHistorySensor();

  const limited = readings.slice(0, limit);
  const values = limited.filter((r) => typeof r.value === 'number').map((r) => r.value);
  const temps = limited.filter((r) => typeof r.temperature === 'number').map((r) => r.temperature!);
  const hums = limited.filter((r) => typeof r.humidity === 'number').map((r) => r.humidity!);

  const average = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b) / temps.length : null;
  const avgHum = hums.length > 0 ? hums.reduce((a, b) => a + b) / hums.length : null;

  return {
    readings: limited,
    average,
    max,
    min,
    avgTemp,
    avgHum,
    loading,
    error,
  };
};

/**
 * Hook to get hourly aggregated sensor readings
 */
export const useHourlySensorData = () => {
  const { readings, loading, error } = useHistorySensor();

  const hourlyData = readings.reduce((acc: any, reading) => {
    const hour = new Date(reading.timestamp).toISOString().substring(0, 13);
    if (!acc[hour]) {
      acc[hour] = [];
    }
    acc[hour].push(reading.value);
    return acc;
  }, {});

  const hourlyReadings = Object.entries(hourlyData).map(([hour, values]: [string, any]) => ({
    hour,
    average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
  }));

  return { readings: hourlyReadings, loading, error };
};

/**
 * Transform sensor readings to chart data format
 */
export const transformSensorReadingsToChartData = (readings: SensorReading[]) => {
  return readings.map((reading) => ({
    timestamp: reading.timestamp,
    time: reading.time || new Date(reading.timestamp).toLocaleTimeString('en-US', { hour12: false }),
    date: reading.date || new Date(reading.timestamp).toISOString().split('T')[0],
    co: typeof reading.value === 'number' ? Number(reading.value.toFixed(2)) : 0,
    temp: typeof reading.temperature === 'number' ? Number(reading.temperature.toFixed(1)) : null,
    humidity: typeof reading.humidity === 'number' ? Number(reading.humidity.toFixed(1)) : null,
  }));
};

/**
 * Build JSON dataset from MQ5 sensor data for ML training
 */
export const buildMQ5DatasetJSON = (readings: SensorReading[]) => {
  const data = readings
    .filter((r) => typeof r.value === 'number')
    .map((r) => ({
      timestamp: r.timestamp,
      co_ppm: Number(r.value.toFixed(2)),
      temperature_c: typeof r.temperature === 'number' ? Number(r.temperature.toFixed(1)) : null,
      humidity_percent: typeof r.humidity === 'number' ? Number(r.humidity.toFixed(1)) : null,
    }));

  return {
    sensor_type: 'MQ5',
    unit: 'ppm',
    data_points: data.length,
    data,
  };
};

/**
 * Hook to get history data for a specific day from Firebase
 */
export const useHistoryByDay = (date: string) => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const dayRef = ref(db, `history_by_day/${date}`);

    const unsubscribe = onValue(
      dayRef,
      (snapshot) => {
        try {
          const dayData = snapshot.val();
          const allReadings: SensorReading[] = [];

          if (dayData && typeof dayData === 'object') {
            // Iterate through hours (00-23)
            Object.entries(dayData).forEach(([hour, hourData]: [string, any]) => {
              if (hour === 'day_summary') return; // Skip summary

              if (typeof hourData === 'object' && hourData !== null) {
                // Iterate through timestamps in this hour
                Object.entries(hourData).forEach(([timestamp, reading]: [string, any]) => {
                  if (typeof reading === 'object' && reading !== null) {
                    const ts = normalizeTimestamp(timestamp);
                    allReadings.push({
                      date,
                      time: new Date(ts).toLocaleTimeString('en-US', { hour12: false }),
                      value: reading.value ?? reading.co ?? 0,
                      timestamp: ts,
                      unit: 'ppm',
                      sensor_type: 'MQ-5',
                      temperature: reading.temperature ?? null,
                      humidity: reading.humidity ?? null,
                      sensor_connected: reading.sensor_connected ?? true,
                      gaz_detecte: reading.gaz_detecte ?? false,
                    });
                  }
                });
              }
            });
          }

          // Sort by timestamp
          allReadings.sort((a, b) => a.timestamp - b.timestamp);
          setReadings(allReadings);
        } catch (err) {
          console.error('Error processing day data:', err);
          setError('Failed to load day data');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Day history listener error:', err);
        setError(err?.message ?? 'Failed to connect');
        setLoading(false);
      }
    );

    return () => {
      try { unsubscribe(); } catch (e) {
        try { off(dayRef); } catch { }
      }
    };
  }, [date]);

  return { readings, loading, error };
};

/**
 * Hook to get today's history data
 */
export const useTodayHistory = () => {
  const today = new Date().toISOString().split('T')[0];
  return useHistoryByDay(today);
};

/**
 * Hook to get list of available days in history
 */
export const useAvailableDays = () => {
  const [days, setDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getDatabase();
    const historyRef = ref(db, 'history_by_day');

    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data && typeof data === 'object') {
            const daysList = Object.keys(data).sort((a, b) => b.localeCompare(a)); // Sort descending
            setDays(daysList);
          } else {
            setDays([]);
          }
        } catch (err) {
          console.error('Error getting available days:', err);
          setError('Failed to load available days');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Available days listener error:', err);
        setError(err?.message ?? 'Failed to connect');
        setLoading(false);
      }
    );

    return () => {
      try { unsubscribe(); } catch (e) {
        try { off(historyRef); } catch { }
      }
    };
  }, []);

  return { days, loading, error };
};

/**
 * Hook to get summary statistics for a specific day
 */
export const useDaySummary = (date: string) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const summaryRef = ref(db, `history_by_day/${date}/day_summary`);

    const unsubscribe = onValue(
      summaryRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          setSummary(data);
        } catch (err) {
          console.error('Error getting day summary:', err);
          setError('Failed to load summary');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Summary listener error:', err);
        setError(err?.message ?? 'Failed to connect');
        setLoading(false);
      }
    );

    return () => {
      try { unsubscribe(); } catch (e) {
        try { off(summaryRef); } catch { }
      }
    };
  }, [date]);

  return { summary, loading, error };
};

/**
 * Hook to accumulate real-time sensor readings continuously
 * - Listens to live sensor data
 * - Accumulates readings in state (for charts)
 * - Automatically saves to history_by_day every minute
 * - Generates chart data with all 24 hours on X axis
 */
export const useRealtimeAccumulator = () => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const latestSensor = useLatestSensor();
  const lastAddedRef = useRef<number>(0);

  // Add new reading when latestSensor changes
  useEffect(() => {
    const { latest } = latestSensor;
    if (!latest || !latest.value) return;

    const now = Date.now();
    // Only add a new point every 5 seconds to avoid too frequent updates
    if (now - lastAddedRef.current < 5000) return;

    const newReading: SensorReading = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      value: latest.value,
      timestamp: now,
      unit: 'ppm',
      sensor_type: 'MQ-5',
      temperature: latest.temperature ?? null,
      humidity: latest.humidity ?? null,
      sensor_connected: latest.sensor_connected ?? true,
      gaz_detecte: latest.gaz_detecte ?? false,
    };

    setReadings(prev => {
      // Keep only readings from today
      const today = new Date().toISOString().split('T')[0];
      const todayReadings = prev.filter(r => r.date === today);
      return [...todayReadings, newReading].slice(-1440); // Max 24h of 1-min readings
    });

    lastAddedRef.current = now;
  }, [latestSensor.latest?.timestamp]);

  // Generate chart data with all 24 hours for X axis
  const generateFullDayChartData = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toISOString().split('T')[0];

    // Create base data points for all hours up to current hour
    const baseData: any[] = [];
    for (let hour = 0; hour <= currentHour; hour++) {
      const hourReadings = readings.filter(r => {
        const rHour = new Date(r.timestamp).getHours();
        return r.date === today && rHour === hour;
      });

      if (hourReadings.length > 0) {
        // Use actual readings for this hour
        hourReadings.forEach(r => {
          baseData.push({
            timestamp: r.timestamp,
            time: r.time,
            co: r.value,
            temp: r.temperature,
            humidity: r.humidity,
          });
        });
      } else {
        // Add placeholder for hour with no data
        const hourTs = new Date(today).setHours(hour, 0, 0, 0);
        baseData.push({
          timestamp: hourTs,
          time: `${String(hour).padStart(2, '0')}:00:00`,
          co: null,
          temp: null,
          humidity: null,
        });
      }
    }

    return baseData.sort((a, b) => a.timestamp - b.timestamp);
  };

  return {
    readings,
    chartData: generateFullDayChartData(),
    latest: latestSensor.latest,
    loading: latestSensor.loading,
  };
};
