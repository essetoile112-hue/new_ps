export const MOCK_SENSORS = [
  { id: 'S-01', name: 'Station 1', lat: 36.8065, lon: 10.1815, aqi: 42, last: '2025-11-23T12:34:00Z' },
  { id: 'S-02', name: 'Station 2', lat: 36.8188, lon: 10.1650, aqi: 78, last: '2025-11-23T12:30:00Z' },
  { id: 'S-03', name: 'Station 3', lat: 36.8000, lon: 10.2000, aqi: 110, last: '2025-11-23T12:20:00Z' }
];

export const MOCK_ALERTS = [
  { id: 'A1', level: 'critical', msg: 'PM2.5 spiked above 150 at Station 3', ts: '2025-11-23T11:58:00Z' },
  { id: 'A2', level: 'warning', msg: 'Sensor 2 reported intermittent connectivity', ts: '2025-11-23T10:22:00Z' },
  { id: 'A3', level: 'info', msg: 'Daily maintenance scheduled', ts: '2025-11-22T08:00:00Z' }
];

export const SYSTEM_STATS = {
  globalAqi: 72,
  activeSensors: 24,
  totalDeployed: 30,
  activeAlerts: 5,
  systemUptime: 99.8
};

// 24 points for last 24h
export const CHART_DATA_PM = Array.from({ length: 24 }).map((_, i) => {
  const hour = (i + 1) % 24;
  const base = 20 + Math.sin(i / 3) * 8 + Math.random() * 2;
  return {
    time: `${hour}:00`,
    pm25: Math.round((base + (i % 6)) * 10) / 10,
    pm10: Math.round((base + (i % 4) + 3) * 10) / 10,
    co2: Math.round((300 + Math.abs(Math.sin(i / 4)) * 200) / 1)
  };
});

export const RADAR_DATA = [
  { subject: 'PM2.5', A: 65, B: 75 },
  { subject: 'PM10', A: 70, B: 60 },
  { subject: 'CO2', A: 80, B: 68 },
  { subject: 'Humidity', A: 60, B: 72 },
  { subject: 'Temp', A: 55, B: 66 }
];

export default {};
