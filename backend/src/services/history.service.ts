import * as admin from 'firebase-admin';

/**
 * Build complete dataset from all history for ML training
 * This mirrors the frontend historyService but for backend use
 */
export const buildCompleteDataset = async () => {
  try {
    console.log('[buildCompleteDataset] Starting to build dataset from Firebase...');
    const db = admin.database();
    const historyRef = db.ref('history_by_day');

    console.log('[buildCompleteDataset] Fetching /history_by_day from Firebase...');
    const snapshot = await historyRef.get();
    console.log('[buildCompleteDataset] ✅ Firebase snapshot retrieved');
    
    const allDays = snapshot.val();
    console.log('[buildCompleteDataset] Snapshot.val() result:', allDays ? `Found data (type: ${typeof allDays})` : 'null/undefined');

    if (!allDays) {
      console.log('[buildCompleteDataset] ⚠️  No data in /history_by_day, returning empty dataset');
      return { data: [], days: 0, total_points: 0 };
    }

    const dayKeys = Object.keys(allDays);
    console.log(`[buildCompleteDataset] Found ${dayKeys.length} day(s): ${dayKeys.slice(0, 5).join(', ')}${dayKeys.length > 5 ? '...' : ''}`);

    const dataset: Array<{
      timestamp: number;
      date: string;
      hour: number;
      value: number;
      temperature: number | null;
      humidity: number | null;
    }> = [];

    let pointsRead = 0;
    Object.entries(allDays).forEach(([day, dayData]: [string, any]) => {
      if (typeof dayData !== 'object' || dayData === null) {
        console.log(`[buildCompleteDataset] Skipping day "${day}" (not object)`);
        return;
      }

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
            pointsRead++;
          }
        });
      });
    });

    // Sort by timestamp
    dataset.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`[buildCompleteDataset] ✅ Dataset built: ${dataset.length} points from ${dayKeys.length} days`);
    console.log(`[buildCompleteDataset] Data range: min=${Math.min(...dataset.map(d => d.value))}, max=${Math.max(...dataset.map(d => d.value))}`);

    return {
      data: dataset,
      days: dayKeys.filter((k) => k !== 'day_summary').length,
      total_points: dataset.length,
    };
  } catch (err: any) {
    console.error('[buildCompleteDataset] ❌ CRITICAL ERROR:', err.message);
    console.error('[buildCompleteDataset] Stack:', err.stack);
    console.error('[buildCompleteDataset] Returning empty dataset as fallback');
    return { data: [], days: 0, total_points: 0 };
  }
};
