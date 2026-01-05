import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, off, get } from 'firebase/database';

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
 * Listens directly to capteur_gaz and dht nodes for real-time updates
 */
export const useLatestSensor = () => {
  const [gasData, setGasData] = useState<any>(null);
  const [dhtData, setDhtData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Combine gas + dht into a SensorReading using exact RTDB values
  const latest: SensorReading | null = gasData || dhtData
    ? {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        // Prefer the calibrated concentration value over raw ADC
        value: gasData?.concentration_relative ?? gasData?.concentration ?? gasData?.valeur_analogique ?? gasData?.value ?? 0,
        timestamp: gasData?.timestamp ?? dhtData?.timestamp ?? Date.now(),
        unit: 'ppm',
        sensor_type: 'MQ-5',
        temperature: dhtData?.temperature ?? null,
        humidity: dhtData?.humidity ?? null,
        sensor_connected: gasData?.sensor_connected ?? null,
        gaz_detecte: gasData?.gaz_detecte ?? null,
      }
    : null;

  useEffect(() => {
    const db = getDatabase();
    let loadedCount = 0;

    // Listen to capteur_gaz directly
    const gasRef = ref(db, 'capteur_gaz');
    const gasUnsub = onValue(
      gasRef,
      (snap) => {
        try {
          const val = snap.val();
          console.debug('🔥 capteur_gaz LIVE:', val);
          setGasData(val);
          loadedCount++;
          if (loadedCount >= 2) setLoading(false);
        } catch (e) {
          console.error('Error reading capteur_gaz:', e);
        }
      },
      (err) => {
        console.error('capteur_gaz listener error:', err);
        setError(err?.message || 'RTDB error');
        setLoading(false);
      }
    );

    // Listen to dht directly
    const dhtRef = ref(db, 'dht');
    const dhtUnsub = onValue(
      dhtRef,
      (snap) => {
        try {
          const val = snap.val();
          console.debug('🔥 dht LIVE:', val);
          setDhtData(val);
          loadedCount++;
          if (loadedCount >= 2) setLoading(false);
        } catch (e) {
          console.error('Error reading dht:', e);
        }
      },
      (err) => {
        console.error('dht listener error:', err);
        setError(err?.message || 'RTDB error');
        setLoading(false);
      }
    );

    return () => {
      try { gasUnsub(); } catch {}
      try { dhtUnsub(); } catch {}
    };
  }, []);

  return { latest, loading, error };
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
    const historyRef = ref(db, 'history/capteur_gaz');

    const handleSnapshot = (snapshot: any) => {
      try {
        const val = snapshot.val();
        if (!val) {
          setReadings(getStoredReadings());
          setLoading(false);
          return;
        }

        // snapshot is an object of pushed items; convert to array sorted by timestamp
        const arr = Object.keys(val).map((k) => ({ id: k, ...(val[k] as any) }));
        arr.sort((a: any, b: any) => (normalizeTimestamp(a.timestamp) || 0) - (normalizeTimestamp(b.timestamp) || 0));

        // Map to SensorReading shape (best-effort)
        const mapped: SensorReading[] = arr.map((r: any) => {
          const ts = normalizeTimestamp(r.timestamp);
          return {
            date: new Date(ts).toISOString().split('T')[0],
            time: new Date(ts).toLocaleTimeString('en-US', { hour12: false }),
            value: (r.concentration_relative ?? r.concentration ?? r.valeur_analogique ?? r.value) || 0,
            timestamp: ts,
            unit: 'ppm',
            sensor_type: 'MQ-5',
            temperature: r.dht?.temperature ?? r.temperature ?? null,
            humidity: r.dht?.humidity ?? r.humidity ?? null,
          };
        });

        // Save to localStorage for offline fallback
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        } catch {}

        setReadings(mapped);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to read history');
        setLoading(false);
      }
    };

    const unsubscribe = onValue(historyRef, handleSnapshot, (err: any) => {
      setError(err?.message || 'RTDB error');
      setLoading(false);
    });

    return () => {
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (e) {
        try { off(historyRef); } catch {}
      }
    };
  }, []);

  return { readings, loading, error };
};

/**
 * Fetch the full `/history/capteur_gaz` once and return a JSON payload
 * suitable for POST /api/predictions/train
 */
export const buildMQ5DatasetJSON = async () => {
  try {
    const db = getDatabase();
    const historyRef = ref(db, 'history/capteur_gaz');
    const snap = await get(historyRef);
    const val = snap.val();
    if (!val) return { readings: [] };

    const arr = Object.keys(val).map((k) => ({ id: k, ...(val[k] as any) }));
    arr.sort((a: any, b: any) => (normalizeTimestamp(a.timestamp) || 0) - (normalizeTimestamp(b.timestamp) || 0));

    const readings = arr.map((r: any) => ({
      timestamp: normalizeTimestamp(r.timestamp),
      valeur_analogique: r.valeur_analogique ?? r.value ?? null,
      concentration_relative: r.concentration_relative ?? r.concentration ?? null,
      tension_mesuree: r.tension_mesuree ?? null,
      temperature: r.dht?.temperature ?? r.temperature ?? null,
      humidity: r.dht?.humidity ?? r.humidity ?? null,
      gaz_detecte: r.gaz_detecte ?? null,
      raw: r,
    }));

    return { readings };
  } catch (err) {
    return { readings: [] };
  }
};

/**
 * Hook to fetch sensor readings from the backend API or localStorage
 */
export const useSensorReadings = (endpoint: string, dependencies: any[] = []) => {
  const [data, setData] = useState<SensorData>(() => {
    // Initialize with stored data
    const stored = getStoredReadings();
    if (stored.length > 0) {
      const avgValue = stored.reduce((sum, r) => sum + r.value, 0) / stored.length;
      const maxValue = Math.max(...stored.map(r => r.value));
      const minValue = Math.min(...stored.map(r => r.value));
      return {
        readings: stored,
        average: avgValue,
        max: maxValue,
        min: minValue,
        latest: stored[stored.length - 1] || null,
        loading: false,
        error: null,
      };
    }
    
    return {
      readings: [],
      average: 0,
      max: 0,
      min: 0,
      latest: null,
      loading: true,
      error: null,
    };
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData((prev) => ({ ...prev, loading: true }));
        const response = await fetch(`/api/sensors${endpoint}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // If serverTime provided, adjust timestamps for client display (align server clocks to client local)
        let readings = result.readings || [];
        if (result.serverTime && readings.length) {
          const clientServerDelta = Date.now() - Number(result.serverTime);
          readings = readings.map((r: any) => ({ ...r, timestamp: (r.timestamp || Date.now()) + clientServerDelta }));
        }

        setData({
          readings,
          average: result.average || 0,
          max: result.max || 0,
          min: result.min || 0,
          latest: readings?.[readings.length - 1] || null,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        // Fallback to stored history or mock data when API fails
        const storedReadings = getStoredReadings();
        const avgValue = storedReadings.reduce((sum, r) => sum + r.value, 0) / storedReadings.length;
        const maxValue = Math.max(...storedReadings.map(r => r.value));
        const minValue = Math.min(...storedReadings.map(r => r.value));
        
        setData({
          readings: storedReadings,
          average: avgValue,
          max: maxValue,
          min: minValue,
          latest: storedReadings[storedReadings.length - 1] || null,
          loading: false,
          error: null, // Don't show error if using stored data
        });
      }
    };

    fetchData();
  }, dependencies);

  return data;
};

/**
 * Transform raw sensor readings to chart-friendly format
 */
export const transformSensorReadingsToChartData = (readings: SensorReading[]) => {
  return readings.map((r) => ({
    timestamp: r.timestamp,
    time: r.time,
    co: r.value,
    temperature: r.temperature ?? 0,
    humidity: r.humidity ?? 0,
  }));
};

/**
 * Hook to fetch today's sensor data from backend API
 */
export const useTodaySensorData = () => {
  return useSensorReadings('/today');
};

/**
 * Hook to fetch all sensor history from backend API
 */
export const useAllSensorHistory = () => {
  return useSensorReadings('/history');
};
