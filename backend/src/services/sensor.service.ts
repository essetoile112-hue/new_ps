import * as admin from 'firebase-admin';
import { Database } from 'firebase-admin/database';

export interface SensorReading {
  date: string;        // Format: YYYY-MM-DD
  time: string;        // Format: HH:MM:SS
  value: number;       // CO/Methane concentration in ppm
  timestamp: number;   // Unix timestamp
  unit: string;        // "ppm"
  sensor_type: string; // "MQ7/MQ9"
  temperature?: number | null;
  humidity?: number | null;
}

export interface SensorHistory {
  readings: SensorReading[];
  lastUpdated: number;
  average: number;
  max: number;
  min: number;
}

class SensorService {
  private db: Database;

  constructor() {
    this.db = admin.database();
  }

  // Normalize timestamps to milliseconds. Accepts seconds or milliseconds.
  private normalizeToMs(ts: any): number {
    if (ts === undefined || ts === null) return Date.now();
    const n = Number(ts);
    if (!Number.isFinite(n)) return Date.now();
    if (n < 1e12) return Math.floor(n * 1000);
    return Math.floor(n);
  }

  // Clamp timestamp to reasonable bounds relative to server time.
  // If timestamp is more than `futureAllowanceMs` in the future, set to now.
  // If timestamp is older than `pastAllowanceMs`, set to now (or could leave as-is).
  private clampTimestamp(ts: any, opts?: { futureAllowanceMs?: number; pastAllowanceMs?: number }): number {
    const now = Date.now();
    const futureAllowanceMs = opts?.futureAllowanceMs ?? 5 * 60 * 1000; // 5 minutes
    const pastAllowanceMs = opts?.pastAllowanceMs ?? 30 * 24 * 60 * 60 * 1000; // 30 days

    const n = this.normalizeToMs(ts);
    if (n > now + futureAllowanceMs) return now;
    if (n < now - pastAllowanceMs) return now;
    return n;
  }

  /**
   * Get the latest sensor reading from capteur_gaz
   */
  async getLatestReading(): Promise<SensorReading | null> {
    try {
      const snapshot = await this.db.ref('/capteur_gaz').get();
      const data = snapshot.val() as any;
      
      if (!data) return null;
      
      // Transform Firebase data to SensorReading format
      const ts = this.clampTimestamp(data.timestamp);
      return {
        date: new Date(ts).toISOString().split('T')[0],
        time: new Date(ts).toLocaleTimeString('en-US', { hour12: false }),
        value: data.concentration || 0,
        timestamp: ts,
        unit: 'ppm',
        sensor_type: 'MQ7/MQ9'
      };
    } catch (error) {
      console.error('Error getting latest sensor reading:', error);
      return null;
    }
  }

  /**
   * Get sensor readings for a specific date range from capteur_gaz
   */
  async getReadingsByDateRange(startDate: string, endDate: string): Promise<SensorReading[]> {
    try {
      const snapshot = await this.db.ref('/capteur_gaz').get();
      const data = snapshot.val() as any;

      if (!data) return [];

      // For now, return current reading if it's within date range
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      if (currentDate >= startDate && currentDate <= endDate) {
        const ts = this.clampTimestamp(data.timestamp);
        return [{
          date: new Date(ts).toISOString().split('T')[0],
          time: new Date(ts).toLocaleTimeString('en-US', { hour12: false }),
          value: data.concentration || 0,
          timestamp: ts,
          unit: 'ppm',
          sensor_type: 'MQ7/MQ9'
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting readings by date range:', error);
      return [];
    }
  }

  /**
   * Get readings for today
   */
  async getTodayReadings(): Promise<SensorReading[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getReadingsByDateRange(today, today);
  }

  /**
   * Get last N readings - returns current reading from capteur_gaz
   */
  async getLastNReadings(n: number): Promise<SensorReading[]> {
    try {
      const snapshot = await this.db.ref('/capteur_gaz').get();
      const data = snapshot.val() as any;

      if (!data) return [];

      const ts = this.clampTimestamp(data.timestamp);
      const reading: SensorReading = {
        date: new Date(ts).toISOString().split('T')[0],
        time: new Date(ts).toLocaleTimeString('en-US', { hour12: false }),
        value: data.concentration || 0,
        timestamp: ts,
        unit: 'ppm',
        sensor_type: 'MQ7/MQ9'
      };

      // Return array of N copies of current reading
      return Array(Math.min(n, 1)).fill(reading);
    } catch (error) {
      console.error('Error getting last N readings:', error);
      return [];
    }
  }

  /**
   * Calculate statistics for readings
   */
  calculateStats(readings: SensorReading[]): SensorHistory {
    if (readings.length === 0) {
      return {
        readings: [],
        lastUpdated: Date.now(),
        average: 0,
        max: 0,
        min: 0,
      };
    }

    const values = readings.map((r) => r.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      readings,
      lastUpdated: Date.now(),
      average,
      max,
      min,
    };
  }

  /**
   * Get hourly aggregated data
   */
  async getHourlyData(date: string): Promise<Array<{ hour: string; average: number; count: number }>> {
    try {
      const readings = await this.getReadingsByDateRange(date, date);

      const hourlyMap = new Map<string, { sum: number; count: number }>();

      readings.forEach((reading) => {
        const hour = reading.time.substring(0, 2); // HH from HH:MM:SS
        const key = `${hour}:00`;

        if (!hourlyMap.has(key)) {
          hourlyMap.set(key, { sum: 0, count: 0 });
        }

        const data = hourlyMap.get(key)!;
        data.sum += reading.value;
        data.count += 1;
      });

      const result: Array<{ hour: string; average: number; count: number }> = [];
      hourlyMap.forEach((data, hour) => {
        result.push({
          hour,
          average: data.sum / data.count,
          count: data.count,
        });
      });

      return result.sort((a, b) => a.hour.localeCompare(b.hour));
    } catch (error) {
      console.error('Error getting hourly data:', error);
      return [];
    }
  }

  /**
   * Store a new sensor reading - updates capteur_gaz
   */
  async storeSensorReading(reading: SensorReading): Promise<boolean> {
    try {
      // Update the current sensor data in capteur_gaz
      // Build update payload, include DHT fields when provided
      const now = Date.now();
      const allowedSkewMs = 5 * 60 * 1000; // 5 minutes
      let storedTs = this.normalizeToMs(reading.timestamp);
      if (Math.abs(now - storedTs) > allowedSkewMs) {
        // reading timestamp is far off — use server time to avoid incorrect chart placement
        storedTs = now;
      }

      const updatePayload: any = {
        concentration: reading.value,
        timestamp: storedTs,
        gaz_detecte: reading.value > 0,
      };
      if (reading.temperature !== undefined && reading.temperature !== null) {
        updatePayload.dht = updatePayload.dht || {};
        updatePayload.dht.temperature = reading.temperature;
      }
      if (reading.humidity !== undefined && reading.humidity !== null) {
        updatePayload.dht = updatePayload.dht || {};
        updatePayload.dht.humidity = reading.humidity;
      }

      await this.db.ref('/capteur_gaz').update(updatePayload);
      // Also append to a history node so we build a dataset over time
      const historyRef = this.db.ref('/history/capteur_gaz');
      const historyPayload: any = {
        date: reading.date,
        time: reading.time,
        value: reading.value,
        timestamp: storedTs,
        unit: reading.unit || 'ppm',
        sensor_type: reading.sensor_type || 'MQ',
      };
      if (reading.temperature !== undefined) historyPayload.temperature = reading.temperature;
      if (reading.humidity !== undefined) historyPayload.humidity = reading.humidity;

      await historyRef.push(historyPayload);
      return true;
    } catch (error) {
      console.error('Error storing sensor reading:', error);
      return false;
    }
  }

  /**
   * Listen to real-time updates
   */
  subscribeToLatestReading(callback: (reading: SensorReading | null) => void): () => void {
    const ref = this.db.ref('/sensors/gas_sensor/latest');
    const listener = ref.on('value', (snapshot) => {
      callback(snapshot.val() as SensorReading | null);
    });

    // Return unsubscribe function
    return () => {
      ref.off('value', listener);
    };
  }

  /**
   * Get statistics for a date
   */
  async getStatisticsForDate(date: string): Promise<SensorHistory> {
    const readings = await this.getReadingsByDateRange(date, date);
    return this.calculateStats(readings);
  }
}

export default new SensorService();
