import { Router, Request, Response } from 'express';
import sensorService from '../../services/sensor.service';

const router = Router();

// Convert incoming timestamps to milliseconds. If timestamp looks like seconds (10 digits)
// convert by multiplying by 1000. If missing or invalid, return Date.now().
const normalizeTimestamp = (ts: any): number => {
  if (ts === undefined || ts === null) return Date.now();
  const n = Number(ts);
  if (!Number.isFinite(n)) return Date.now();
  // If it's clearly seconds (10 digits / < 1e12), convert to ms
  if (n < 1e12) return Math.floor(n * 1000);
  return Math.floor(n);
};

/**
 * GET /api/sensors/latest
 * Get the latest sensor reading
 */
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const reading = await sensorService.getLatestReading();

    if (!reading) {
      return res.status(404).json({ error: 'No sensor reading available' });
    }

    res.json({ reading, serverTime: Date.now() });
  } catch (error) {
    console.error('Error fetching latest sensor reading:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sensors/today
 * Get all sensor readings for today
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const readings = await sensorService.getTodayReadings();
    const stats = sensorService.calculateStats(readings);

    res.json({
      readings,
      count: readings.length,
      average: stats.average,
      max: stats.max,
      min: stats.min,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching today readings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sensors/last/:count
 * Get last N readings
 */
router.get('/last/:count', async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.params.count) || 24;
    const readings = await sensorService.getLastNReadings(count);
    const stats = sensorService.calculateStats(readings);

    res.json({
      readings,
      count: readings.length,
      average: stats.average,
      max: stats.max,
      min: stats.min,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching last readings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sensors/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Get readings for a date range
 */
router.get('/range', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    const readings = await sensorService.getReadingsByDateRange(
      String(start),
      String(end)
    );
    const stats = sensorService.calculateStats(readings);

    res.json({
      readings,
      count: readings.length,
      average: stats.average,
      max: stats.max,
      min: stats.min,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching range readings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sensors/hourly?date=YYYY-MM-DD
 * Get hourly aggregated data
 */
router.get('/hourly', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const hourlyData = await sensorService.getHourlyData(date);

    res.json({
      date,
      hourly_data: hourlyData,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching hourly data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sensors/stats?date=YYYY-MM-DD
 * Get statistics for a specific date
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const stats = await sensorService.getStatisticsForDate(date);

    res.json({
      date,
      ...stats,
      reading_count: stats.readings.length,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sensors/reading
 * Store a new sensor reading (from ESP32 or other source)
 */
router.post('/reading', async (req: Request, res: Response) => {
  try {
    const { date, time, value, timestamp, unit, sensor_type, temperature, humidity } = req.body;

    // Validate required fields
    if (!date || !time || value === undefined) {
      return res.status(400).json({
        error: 'date, time, and value are required',
      });
    }

    const reading: any = {
      date,
      time,
      value: parseFloat(String(value)),
      timestamp: normalizeTimestamp(timestamp),
      unit: unit || 'ppm',
      sensor_type: sensor_type || 'MQ7/MQ9',
    };

    if (temperature !== undefined && temperature !== null) {
      const n = Number(temperature);
      if (Number.isFinite(n)) reading.temperature = n;
    }
    if (humidity !== undefined && humidity !== null) {
      const n = Number(humidity);
      if (Number.isFinite(n)) reading.humidity = n;
    }

    const success = await sensorService.storeSensorReading(reading);

    if (success) {
      res.status(201).json({
        message: 'Sensor reading stored successfully',
        reading,
        serverTime: Date.now(),
      });
    } else {
      res.status(500).json({ error: 'Failed to store sensor reading' });
    }
  } catch (error) {
    console.error('Error storing sensor reading:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sensors/mock
 * Create N mock readings and store them (useful for testing realtime and prediction)
 * Body: { count?: number, startValue?: number }
 */
router.post('/mock', async (req: Request, res: Response) => {
  try {
    const count = parseInt(String(req.body.count || '10')) || 10;
    const startValue = parseFloat(String(req.body.startValue || '30')) || 30;

    const now = Date.now();
    const created: any[] = [];

    for (let i = 0; i < count; i++) {
      const ts = now - (count - i - 1) * 60 * 1000; // spaced 1 minute apart
      const v = parseFloat((startValue + Math.sin(i / 3) * 8 + (Math.random() - 0.5) * 3).toFixed(2));
      const d = new Date(ts);
      const reading = {
        date: d.toISOString().split('T')[0],
        time: d.toLocaleTimeString('en-US', { hour12: false }),
        value: v,
        timestamp: ts,
        unit: 'ppm',
        sensor_type: 'MQ-5',
      };

      const ok = await sensorService.storeSensorReading(reading as any);
      created.push({ reading, ok });
      // small delay to avoid overwhelming DB
      await new Promise((r) => setTimeout(r, 50));
    }

    res.json({ created_count: created.length, created });
  } catch (error) {
    console.error('Error creating mock readings:', error);
    res.status(500).json({ error: 'Failed to create mock readings' });
  }
});

export default router;
