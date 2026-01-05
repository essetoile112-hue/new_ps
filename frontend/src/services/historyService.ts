import { getDatabase, ref, set, get } from 'firebase/database';

/**
 * Service to save sensor readings to history_by_day structure in Firebase
 * This should be called periodically (every minute) to store readings
 */
export const saveToHistoryByDay = async (reading: {
  value: number;
  temperature?: number | null;
  humidity?: number | null;
  gaz_detecte?: boolean;
  sensor_connected?: boolean;
}) => {
  const db = getDatabase();
  const now = new Date();

  // Date format: YYYY-MM-DD (using LOCAL time, not UTC)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(now.getDate()).padStart(2, '0');
  const day = `${year}-${month}-${dayOfMonth}`;

  // Hour: 00-23 (local time)
  const hour = String(now.getHours()).padStart(2, '0');
  // Timestamp as key
  const timestamp = now.getTime();

  // Reference: history_by_day/2025-12-19/14/{timestamp}
  const readingRef = ref(db, `history_by_day/${day}/${hour}/${timestamp}`);

  await set(readingRef, {
    value: reading.value,
    temperature: reading.temperature ?? null,
    humidity: reading.humidity ?? null,
    gaz_detecte: reading.gaz_detecte ?? false,
    sensor_connected: reading.sensor_connected ?? true,
    timestamp: timestamp,
  });

  console.log(`[HistoryService] Saved reading to history_by_day/${day}/${hour}/${timestamp}`);
};

/**
 * Update day summary statistics
 */
export const updateDaySummary = async (day: string) => {
  const db = getDatabase();
  const dayRef = ref(db, `history_by_day/${day}`);

  try {
    const snapshot = await get(dayRef);
    const dayData = snapshot.val();

    if (!dayData) return;

    const allValues: number[] = [];
    const emissionHours: number[] = [];
    let firstReading = Infinity;
    let lastReading = 0;

    Object.entries(dayData).forEach(([hour, hourData]: [string, any]) => {
      if (hour === 'day_summary') return;

      if (typeof hourData === 'object' && hourData !== null) {
        Object.entries(hourData).forEach(([ts, reading]: [string, any]) => {
          if (typeof reading === 'object' && reading !== null) {
            const timestamp = Number(ts);
            if (typeof reading.value === 'number') {
              allValues.push(reading.value);
            }
            if (reading.gaz_detecte) {
              emissionHours.push(Number(hour));
            }
            if (timestamp < firstReading) firstReading = timestamp;
            if (timestamp > lastReading) lastReading = timestamp;
          }
        });
      }
    });

    if (allValues.length === 0) return;

    const summaryRef = ref(db, `history_by_day/${day}/day_summary`);
    await set(summaryRef, {
      first_reading: firstReading,
      last_reading: lastReading,
      total_readings: allValues.length,
      avg_co: allValues.reduce((a, b) => a + b, 0) / allValues.length,
      max_co: Math.max(...allValues),
      min_co: Math.min(...allValues),
      emissions_hours: [...new Set(emissionHours)].sort((a, b) => a - b),
    });

    console.log(`[HistoryService] Updated day_summary for ${day}`);
  } catch (err) {
    console.error('[HistoryService] Error updating day summary:', err);
  }
};

/**
 * Initialize a day with first reading
 * Silent fail (logs only) - metadata is not critical for operation
 */
export const initializeDay = async (day: string) => {
  const db = getDatabase();
  const metaRef = ref(db, 'history_meta');

  try {
    const snapshot = await get(metaRef);
    const meta = snapshot.val() || {};

    const newMeta = {
      first_day: meta.first_day || day,
      last_day: day,
      total_days: (meta.total_days || 0) + (meta.last_day !== day ? 1 : 0),
      last_update: Date.now(),
    };

    await set(metaRef, newMeta);
    console.log(`[HistoryService] Updated history_meta for ${day}`);
  } catch (err) {
    // Metadata initialization is optional - log but don't fail
    console.warn(`[HistoryService] Could not initialize day metadata (optional):`, err?.message || err);
  }
};

/**
 * Build complete dataset from all history for ML training
 */
export const buildCompleteDataset = async () => {
  const db = getDatabase();
  const historyRef = ref(db, 'history_by_day');

  try {
    const snapshot = await get(historyRef);
    const allDays = snapshot.val();

    if (!allDays) return { data: [], days: 0, total_points: 0 };

    const dataset: Array<{
      timestamp: number;
      date: string;
      hour: number;
      value: number;
      temperature: number | null;
      humidity: number | null;
    }> = [];

    Object.entries(allDays).forEach(([day, dayData]: [string, any]) => {
      if (typeof dayData !== 'object' || dayData === null) return;

      Object.entries(dayData).forEach(([hour, hourData]: [string, any]) => {
        if (hour === 'day_summary') return;
        if (typeof hourData !== 'object' || hourData === null) return;

        Object.entries(hourData).forEach(([ts, reading]: [string, any]) => {
          if (typeof reading === 'object' && reading !== null && typeof reading.value === 'number') {
            dataset.push({
              timestamp: Number(ts),
              date: day,
              hour: Number(hour),
              value: reading.value,
              temperature: reading.temperature ?? null,
              humidity: reading.humidity ?? null,
            });
          }
        });
      });
    });

    // Sort by timestamp
    dataset.sort((a, b) => a.timestamp - b.timestamp);

    return {
      data: dataset,
      days: Object.keys(allDays).filter(k => k !== 'day_summary').length,
      total_points: dataset.length,
    };
  } catch (err) {
    console.error('[HistoryService] Error building dataset:', err);
    return { data: [], days: 0, total_points: 0 };
  }
};
