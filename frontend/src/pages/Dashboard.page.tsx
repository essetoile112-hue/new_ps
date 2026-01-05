import React, { useRef, useState, useEffect } from 'react';
import '../styles/dashboard.css';
import { MainLayout } from '../components/layout/main-layout';
import { StatCard } from '../components/Widgets/stat-card';
import { LeafletMap } from '../components/Widgets/leaflet-map';
import LiveNetworkMap from '../components/LiveNetworkMap';
import { PredictionChart as PredictionChartWidget } from '../components/Widgets/prediction-chart';
import { ExportButtons } from '../components/Widgets/export-buttons';
import { LatestSensorCard, HourlyGasSensorChart, GasSensorStatusWidget } from '../components/sensors/GasSensorChart';
import { SimplePredictionChart } from '../components/sensors/SimplePredictionChart';
import { CoGaugeWidget } from '../components/Widgets/co-gauge'; // New Gauge Import
import { DebugSensorValues } from '../components/Widgets/debug-sensor-values'; // Debug Component
import { PredictionChart } from '../components/sensors/PredictionChart';
import { transformSensorReadingsToChartData, useTodaySensorData, useHistorySensor, useLatestSensor, useHistoryByDay, useRealtimeAccumulator } from '../hooks/useSensorData';
import { SYSTEM_STATS, CHART_DATA_PM, MOCK_SENSORS } from '../lib/mock-data';
import { AreaChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Bar, Legend, ScatterChart, Scatter, PieChart, Pie, Cell, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Home, BarChart3, FileText, HelpCircle, ChevronRight, User as UserIcon, Thermometer, MapPin, AlertTriangle, Layers, DownloadCloud, Truck, History, Activity, Wind } from 'lucide-react';
import { useAuth } from '../utils/useAuth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.config';
import { exportToCSV, exportToJSON, exportToPDF } from '../utils/exportUtils';
import logoSvg from '../assets/images/u4-logo.svg';

const Sidebar = ({ activeMenuItem, setActiveMenuItem, scrollTo }: { activeMenuItem: string, setActiveMenuItem: (s: string) => void, scrollTo?: (id: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: Home },
    { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
    { id: 'predictions', label: 'AI Predictions & Reports', icon: FileText },
  ];

  return (
    <div className="hidden md:flex w-64 bg-gradient-to-b from-teal-800 to-teal-900 text-white flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-teal-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
            <img
              src="/assets/icons/u4-logo.png"
              alt="U4GreenAFRICA"
              className="w-10 h-10 object-cover"
              onError={(e) => {
                const target = e.target;
                if (target instanceof HTMLImageElement) {
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('img.fallback-svg');
                    if (fallback instanceof HTMLImageElement) fallback.style.display = 'block';
                  }
                }
              }}
            />
            <img src={logoSvg} alt="U4Green" className="fallback-svg w-10 h-10 object-cover hidden" />
          </div>
          <span className="text-xl font-bold">U4GreenAFRICA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenuItem === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveMenuItem(item.id);
                    if (scrollTo) scrollTo(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800/50'
                    }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-teal-700">
        <UserProfile />
      </div>
    </div>
  );
};

function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState < string | null > (null);

  useEffect(() => {
    // Try to get photoURL from Firebase Auth current user
    const fu = auth.currentUser;
    if (fu && fu.photoURL) setPhotoUrl(fu.photoURL);
    else setPhotoUrl(null);
  }, [user]);

  const displayName = user?.fullName && user.fullName.length > 0 ? user.fullName : (user?.email ? user.email.split('@')[0] : 'Utilisateur');
  const initials = user?.fullName ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : (user?.email ? user.email.slice(0, 2).toUpperCase() : 'US');

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={displayName} className="w-10 h-10 object-cover" />
        ) : (
          <span className="text-sm font-semibold text-white">{initials}</span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-xs text-teal-300">{user?.email || ''}</p>
        <button
          onClick={async () => {
            try {
              await logout();
              navigate('/');
            } catch (err) {
              console.error('Logout failed', err);
            }
          }}
          className="mt-2 inline-block bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export const Dashboard = () => {
  const reportRef = useRef < HTMLDivElement > (null);
  const liveRef = useRef < HTMLDivElement > (null);
  const activeVehiclesRef = useRef < HTMLDivElement > (null);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Clear stale localStorage on first load for clean testing
  useEffect(() => {
    const clearFlag = 'u4_cleared_cache_v1';
    if (!localStorage.getItem(clearFlag)) {
      console.log('🧹 Clearing stale sensor cache for clean start...');
      localStorage.removeItem('u4_last_gas_data');
      localStorage.removeItem('u4_last_dht_data');
      localStorage.removeItem('u4_sensor_history');
      localStorage.setItem(clearFlag, 'true');
    }
  }, []);

  // Fetch today's sensor data and RTDB history (prefer history for MQ-5)
  const sensorDataResponse = useTodaySensorData();
  const historyResponse = useHistorySensor();

  // Get today's date for history_by_day
  const today = new Date().toISOString().split('T')[0];
  const todayHistory = useHistoryByDay(today);

  // Use realtime accumulator for continuous updates
  const realtimeAccum = useRealtimeAccumulator();

  const latestSensor = useLatestSensor();
  const { latest: latestFromHook, dhtLatest, gasData, dhtData } = latestSensor;



  // STEP 1: Get historical data for TODAY (all hours from midnight until now)
  let historicalData: any[] = [];

  if (todayHistory.readings && todayHistory.readings.length > 0) {
    // Get all historical data from today (match historical page logic)
    const todayReadings = todayHistory.readings;
    historicalData = transformSensorReadingsToChartData(todayReadings);
    console.log(`✅ Loaded ${historicalData.length} points for today from history_by_day`);
  } else if (realtimeAccum.chartData && realtimeAccum.chartData.length > 0) {
    // Use all realtime accumulator data
    historicalData = realtimeAccum.chartData;
    console.log(`✅ Loaded ${historicalData.length} points for today from realtime accumulator`);
  } else if (historyResponse.readings && historyResponse.readings.length > 0) {
    // Fallback to old history - all of today
    const todayReadings = historyResponse.readings.filter(r => r.date === today);
    historicalData = transformSensorReadingsToChartData(todayReadings);
    console.log(`✅ Loaded ${historicalData.length} points for today from old history`);
  }

  // STEP 2: Add current real-time point (ALWAYS)
  if (latestFromHook && latestFromHook.value !== undefined) {
    const nowTs = Date.now();
    const realtimePoint = {
      timestamp: nowTs,
      time: new Date(nowTs).toLocaleTimeString('en-US', { hour12: false }),
      date: today,
      co: latestFromHook.value,
      temp: dhtLatest?.temperature ?? latestFromHook.temperature ?? null,
      humidity: dhtLatest?.humidity ?? latestFromHook.humidity ?? null,
    };

    // Check if we should add this as a new point or update the last one
    const lastPoint = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;

    if (!lastPoint) {
      // No historical data, just add the real-time point
      historicalData = [realtimePoint];
      console.log('📍 Added first real-time point');
    } else {
      const timeDiff = Math.abs(nowTs - lastPoint.timestamp);

      // If last point is older than 30 seconds, add a new point (new minute)
      if (timeDiff > 30000) {
        historicalData = [...historicalData, realtimePoint];
        console.log(`📍 Added new real-time point (${Math.round(timeDiff / 1000)}s since last)`);
      } else {
        // Update the last point with fresh data
        historicalData = [
          ...historicalData.slice(0, -1),
          { ...lastPoint, ...realtimePoint }
        ];
        console.log('🔄 Updated last point with fresh real-time data');
      }
    }
  }

  // STEP 3: Sort by timestamp to ensure chronological order
  historicalData = historicalData.sort((a, b) => a.timestamp - b.timestamp);
  console.log(`📊 Final chart data: ${historicalData.length} points total`);

  const scrollTo = (id: string) => {
    try {
      if (id === 'live-tracking' && liveRef.current) {
        liveRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (id === 'active-vehicles' && activeVehiclesRef.current) {
        activeVehiclesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      console.warn('Scroll failed', err);
    }
  };

  // Extract real-time values directly from Firebase hooks
  // Temperature and humidity come from dhtLatest (separate DHT sensor node)
  const displayTemp = dhtLatest?.temperature ?? latestFromHook?.temperature ?? null;
  const displayHum = dhtLatest?.humidity ?? latestFromHook?.humidity ?? null;
  // CO value comes from capteur_gaz node
  const displayCO = latestFromHook?.value ?? null;

  // Data source for charts: prefer MQ-5 history (co) + DHT (temp/humidity)
  // CRITICAL: Backfill temp/humidity with real-time values when historical data is null/0
  // This fixes old data that was saved before Firebase path correction
  let dataSource = (historicalData && historicalData.length > 0
    ? historicalData.map((d) => {
      // Use historical values if they exist and are not 0, otherwise use dhtLatest
      const hasHistoricalTemp = d.temperature !== null && d.temperature !== undefined && d.temperature !== 0;
      const hasHistoricalHum = d.humidity !== null && d.humidity !== undefined && d.humidity !== 0;

      return {
        ...d,
        temperature: hasHistoricalTemp
          ? (d.temperature ?? d.temp)
          : (dhtLatest?.temperature ?? 0),
        humidity: hasHistoricalHum
          ? d.humidity
          : (dhtLatest?.humidity ?? 0),
        co: d.co ?? 0
      };
    })
    : CHART_DATA_PM);

  // Add current real-time values as the latest point to ensure chart shows current sensors
  if (dhtLatest?.temperature !== null && dhtLatest?.humidity !== null && dhtLatest?.temperature !== undefined && dhtLatest?.humidity !== undefined) {
    const currentPoint = {
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      temperature: dhtLatest.temperature,  // REAL current temperature
      humidity: dhtLatest.humidity,        // REAL current humidity
      co: displayCO ?? latestFromHook?.value ?? 0,
      date: new Date().toISOString().split('T')[0],
    };
    // Remove any duplicate current minute data before adding
    dataSource = dataSource.filter(d => {
      const pointMin = Math.floor((d.timestamp || Date.now()) / 60000);
      const currentMin = Math.floor(Date.now() / 60000);
      return pointMin !== currentMin;
    });
    dataSource = [...dataSource, currentPoint];
  }

  // Real-time sensor values (latestFromHook and dhtLatest already extracted above)
  const { loading: latestLoading, error: latestError } = latestSensor;
  const [currentTime, setCurrentTime] = useState < number > (Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => { clearInterval(id); };
  }, []);

  // Force dataSource to update when currentTime changes (every second for real-time updates)
  const realtimeDataSource = currentTime ? dataSource : dataSource;



  // Prepare combined latest reading for charts
  const lastFromSource = dataSource && dataSource.length ? dataSource[dataSource.length - 1] : null;
  const latest = {
    co: displayCO ?? lastFromSource?.co ?? 0,
    temperature: displayTemp ?? lastFromSource?.temperature ?? null,
    humidity: displayHum ?? lastFromSource?.humidity ?? null,
    time: latestFromHook?.time ?? (lastFromSource ? lastFromSource.time : undefined),
  };
  const pieData = [
    { name: 'Gas (ppm)', value: latest.co || 0 },
    { name: 'Temp (°C)', value: latest.temperature || 0 },
    { name: 'Humidity (%)', value: latest.humidity || 0 },
  ];
  const pieColors = ['#10b981', '#3b82f6', '#f97316'];

  const formatFullDateTime = (ts?: number | string) => {
    try {
      const t = typeof ts === 'number' ? ts : (ts ? Number(ts) : undefined);
      if (!t) return '—';
      return new Date(t).toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return String(ts ?? '—');
    }
  };


  return (
    <>
      <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} scrollTo={scrollTo} />

      {/* Debug Widget - shows raw Firebase values in real-time (bottom-right corner) */}
      <DebugSensorValues
        gasData={gasData}
        dhtData={dhtData}
        chosenValue={latestFromHook?.value}
        timestamp={latestFromHook?.timestamp}
      />

      <div className="md:ml-64">
        <MainLayout>
          <div ref={reportRef} className="space-y-6">
            <div className="flex items-center justify-center mt-6">
              <div className="w-full max-w-7xl bg-white rounded-2xl shadow-xl p-6 transition-transform transform hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-outfit text-4xl font-bold text-slate-800">Fixed Stations</h1>
                    <p className="text-sm text-slate-500">Real-time environmental monitoring across the network</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeMenuItem !== 'support' ? (
                      <>
                        <button
                          onClick={() => navigate('/historical-data')}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition shadow-md"
                        >
                          <History size={18} />
                          Historical Data
                        </button>
                        <ExportButtons reportRef={reportRef} data={dataSource} />

                      </>
                    ) : null}
                  </div>
                </div>

                {/* Optional preview image (place your attached mock at public/assets/images/dashboard-mock.png) */}
                {/* Support content placeholder: when Support tab is active show structured support UI */}

                <div className="mt-6 mb-6 hover-shine hover-float">
                  <img
                    src="/assets/images/dashboard-mock.png"
                    alt="Dashboard Preview"
                    className="w-full rounded-lg object-cover shadow-md group-hover-scale"
                    onError={(e) => {
                      if (e.target instanceof HTMLImageElement) {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                </div>

                {/* Dashboard Overview Content */}
                {activeMenuItem === 'dashboard' && (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      <div className="group transform transition hover:scale-105 hover-float hover-tilt hover-shine">
                        <div className="group-hover-scale h-full">
                          <StatCard
                            title="Qualité d'Air (CO)"
                            value={displayCO != null ? (displayCO > 15 ? 'Danger' : displayCO > 8 ? 'Attention' : 'Excellent') : '—'}
                            subtitle={displayCO != null ? `${displayCO.toFixed(1)} %` : 'En attente'}
                            icon={<Activity size={24} />}
                            color={displayCO && displayCO > 15 ? 'rose' : displayCO && displayCO > 8 ? 'yellow' : 'emerald'}
                            className="interactive h-full"
                          />
                        </div>
                      </div>
                      <div className="group transform transition hover:scale-105 hover-float hover-tilt hover-shine">
                        <div className="group-hover-scale h-full">
                          <StatCard
                            title="Capteurs Actifs"
                            value={latestFromHook?.sensor_connected && dhtLatest ? "2/2" : latestFromHook?.sensor_connected ? "1/2" : dhtLatest ? "1/2" : "0/2"}
                            subtitle="MQ-5 + DHT22"
                            icon={<MapPin size={24} />}
                            color="blue"
                            className="interactive h-full"
                          />
                        </div>
                      </div>
                      <div className="group transform transition hover:scale-105 hover-float hover-tilt hover-shine">
                        <div className="group-hover-scale h-full">
                          <StatCard
                            title="Alertes Actives"
                            value={displayCO && displayCO > 15 ? "1" : "0"}
                            subtitle={displayCO && displayCO > 15 ? "Seuil critique dépassé" : "Aucune alerte"}
                            icon={<AlertTriangle size={24} />}
                            color={displayCO && displayCO > 15 ? 'rose' : 'slate'}
                            className="interactive h-full"
                          />
                        </div>
                      </div>
                      {/* Real-time Temperature card */}
                      <div className="group transform transition hover:scale-105 hover-float hover-tilt hover-shine">
                        <div className="group-hover-scale h-full">
                          <StatCard
                            title="Température (°C)"
                            value={displayTemp != null ? `${displayTemp.toFixed(1)} °C` : '—'}
                            subtitle={new Date(currentTime).toLocaleTimeString()}
                            icon={<Thermometer size={24} />}
                            color="amber"
                            className="interactive h-full"
                          />
                        </div>
                      </div>

                      {/* Real-time Humidity card */}
                      <div className="group transform transition hover:scale-105 hover-float hover-tilt hover-shine">
                        <div className="group-hover-scale h-full">
                          <StatCard
                            title="Humidité (%)"
                            value={displayHum != null ? `${displayHum.toFixed(1)} %` : '—'}
                            subtitle={new Date(currentTime).toLocaleTimeString()}
                            icon={<Wind size={24} />}
                            color="sky"
                            className="interactive h-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Professional Grid Layout - Middle Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                      {/* Left Column: Live Map (Taking 2/3 width) */}
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        <div ref={liveRef} className="glass-panel p-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="text-emerald-600" size={18} />
                              <span className="font-semibold text-slate-700">Live Network Coverage</span>
                            </div>
                            <div className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full animate-pulse">
                              Live Monitoring
                            </div>
                          </div>
                          <div className="rounded-lg h-[400px] w-full overflow-hidden relative z-0">
                            <LiveNetworkMap sensors={MOCK_SENSORS} height={'400px'} />
                          </div>
                        </div>

                        {/* Area Chart also in the main column flow for consistency */}
                        <div className="glass-panel p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200">
                          <SimplePredictionChart historicalData={dataSource} height={320} />
                        </div>
                      </div>

                      {/* Right Column: Status & Gauge (Taking 1/3 width) */}
                      <div className="flex flex-col gap-6">

                        {/* New Gauge Widget - Clean & Professional */}
                        <div className="glass-panel p-6 rounded-xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden border border-slate-200">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500"></div>
                          <h3 className="text-sm font-semibold text-slate-500 tracking-wider uppercase mb-6">Current CO Level (%)</h3>
                          <div className="h-[220px] w-full">
                            <CoGaugeWidget value={displayCO || 0} maxValue={100} />
                          </div>
                          <div className="mt-4 text-center">
                            <p className="text-xs text-slate-400">Real-time sensor reading</p>
                            <p className="text-xs text-slate-300 mt-1">Updated: {new Date(currentTime).toLocaleTimeString()}</p>
                            <p className={`text-xs font-semibold mt-2 ${latestFromHook?.gaz_detecte ? 'text-red-600' : 'text-emerald-600'}`}>
                              Gas Detected: {latestFromHook?.gaz_detecte ? '✓ YES' : 'No'}
                            </p>
                          </div>
                        </div>

                        {/* Safety & Metrics Analytics (Replacing uninteresting Line Chart) */}
                        <div className="glass-panel p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Safety Analytics (1h)</h3>
                            <div className={`px-2 py-1 rounded-md text-xs font-bold ${(displayCO || 0) < 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {(displayCO || 0) < 50 ? 'SAFE' : 'HAZARD'}
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Safety Score Ring using PieChart */}
                            <div className="relative w-24 h-24 flex-shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[{ value: Math.max(0, 100 - (displayCO || 0) / 2) }, { value: (displayCO || 0) / 2 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={45}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    <Cell fill={(displayCO || 0) < 50 ? '#10b981' : '#ef4444'} />
                                    <Cell fill="#f1f5f9" />
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className={`text-xl font-bold ${(displayCO || 0) < 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {Math.max(0, 100 - Math.round((displayCO || 0) / 2))}%
                                </span>
                              </div>
                            </div>

                            {/* Key Metrics Grid */}
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="text-xs text-slate-500 mb-1">Peak (1h)</div>
                                <div className="text-lg font-bold text-slate-700">
                                  {dataSource.length > 0 ? Math.max(...dataSource.map(d => d.co)).toFixed(1) : '—'}
                                  <span className="text-xs font-normal text-slate-400 ml-1">ppm</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="text-xs text-slate-500 mb-1">Avg (1h)</div>
                                <div className="text-lg font-bold text-slate-700">
                                  {dataSource.length > 0 ? (dataSource.reduce((a, b) => a + b.co, 0) / dataSource.length).toFixed(1) : '—'}
                                  <span className="text-xs font-normal text-slate-400 ml-1">ppm</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">System Status:</span>
                            <span className="text-xs text-emerald-600 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Optimal Performance
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Analytics Content */}
                {activeMenuItem === 'analytics' && (
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-lg font-semibold">Advanced Analytics</div>
                        <div className="text-sm text-gray-600">Deep dive into environmental data patterns with AI-powered insights</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportToCSV(dataSource, 'u4-green-analytics')}
                          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm flex items-center gap-2"
                        >
                          <FileText size={16} /> CSV
                        </button>
                        <button
                          onClick={() => exportToJSON(dataSource, 'u4-green-analytics')}
                          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm flex items-center gap-2"
                        >
                          <DownloadCloud size={16} /> JSON
                        </button>
                        <button
                          onClick={() => exportToPDF(dataSource, 'u4-green-analytics-report')}
                          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm flex items-center gap-2"
                        >
                          <FileText size={16} /> PDF
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-4">Multi-Pollutant Trends</div>
                      <div className="h-64 md:h-[450px] rounded-lg overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={realtimeDataSource}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                              labelFormatter={(value) => {
                                try {
                                  if (typeof value === 'number' && value > 1000000000000) {
                                    return new Date(value).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    });
                                  }
                                  return String(value);
                                } catch {
                                  return String(value);
                                }
                              }}
                            />
                            <Area yAxisId="left" dataKey="temperature" stroke="#f97316" fill="rgba(249,179,22,0)" strokeOpacity={0} fillOpacity={0} name="Temperature (°C)" />
                            <Bar yAxisId="right" dataKey="humidity" fill="#3b82f6" fillOpacity={0} name="Humidity (%)" />
                            <Line yAxisId="left" dataKey="co" stroke="#ef4444" strokeWidth={3} name="Gas (ppm)" />
                            <Legend />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="glass-panel p-4 rounded-lg">
                        <div className="mb-2">Pollutant Distribution</div>
                        <div className="h-56 md:h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dataSource} stackOffset="expand">
                              <XAxis dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                              <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                              <Area dataKey="co" stackId="1" fill="#ef4444" stroke="#ef4444" name="Gas (ppm)" />
                              <Area dataKey="temperature" stackId="1" fill="#f97316" stroke="#f97316" name="Temp (°C)" />
                              <Area dataKey="humidity" stackId="1" fill="#3b82f6" stroke="#3b82f6" name="Humidity (%)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="glass-panel p-4 rounded-lg">
                        <div className="mb-2">Scatter Correlation</div>
                        <div style={{ height: 350 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                              <CartesianGrid />
                              <XAxis dataKey="temperature" name="Temp (°C)" />
                              <YAxis dataKey="co" name="Gas (ppm)" />
                              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                              <Scatter name="corr" data={dataSource.map(d => ({ temperature: d.temperature, co: d.co }))} fill="#ef4444" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 glass-panel p-4 rounded-lg">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">Hourly Emissions Summary</h3>
                        <p className="text-sm text-gray-500">Peak emission hours and distribution analysis</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                          <div className="text-xs font-semibold text-gray-600 mb-2">Peak Hour</div>
                          <div className="text-2xl font-bold text-red-600">
                            {dataSource.length > 0
                              ? (() => {
                                const hourlyData: { [key: number]: number } = {};
                                dataSource.forEach(d => {
                                  const hour = new Date(d.timestamp).getHours();
                                  hourlyData[hour] = (hourlyData[hour] || 0) + (d.co || 0);
                                });
                                const peakHour = Object.entries(hourlyData).reduce((max, [h, v]) => v > max[1] ? [h, v] : max, ['0', 0]);
                                return `${String(peakHour[0]).padStart(2, '0')}:00`;
                              })()
                              : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 mt-2">Highest emission detected</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                          <div className="text-xs font-semibold text-gray-600 mb-2">Daily Average</div>
                          <div className="text-2xl font-bold text-green-600">
                            {dataSource.length > 0
                              ? (dataSource.reduce((sum, d) => sum + (d.co || 0), 0) / dataSource.length).toFixed(1)
                              : '0'}
                          </div>
                          <div className="text-xs text-gray-600 mt-2">ppm</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                          <div className="text-xs font-semibold text-gray-600 mb-2">Trend</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-purple-600">
                              {dataSource.length > 1
                                ? (() => {
                                  const firstValue = dataSource[0]?.co || 0;
                                  const lastValue = dataSource[dataSource.length - 1]?.co || 0;
                                  const change = ((lastValue - firstValue) / (firstValue || 1)) * 100;
                                  return Math.abs(change).toFixed(0) + '%';
                                })()
                                : 'N/A'}
                            </div>
                            <div className="text-xl">
                              {dataSource.length > 1
                                ? (() => {
                                  const firstValue = dataSource[0]?.co || 0;
                                  const lastValue = dataSource[dataSource.length - 1]?.co || 0;
                                  const change = lastValue - firstValue;
                                  return change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
                                })()
                                : ''}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            {dataSource.length > 1
                              ? (() => {
                                const firstValue = dataSource[0]?.co || 0;
                                const lastValue = dataSource[dataSource.length - 1]?.co || 0;
                                const change = lastValue - firstValue;
                                return change > 0 ? 'Emissions increasing' : change < 0 ? 'Emissions decreasing' : 'Stable';
                              })()
                              : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Predictions Content */}
                {activeMenuItem === 'predictions' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="glass-panel p-4 rounded-lg min-h-[420px] h-full">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">CO Emission Predictions with LSTM</h3>
                        <p className="text-sm text-gray-600">Train on historical measurements and predict future emissions</p>
                      </div>
                      <PredictionChart historicalData={historicalData} height={450} />
                    </div>
                  </div>
                )}

                {/* Support Content */}
                {activeMenuItem === 'support' && (
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="text-lg font-semibold">Support</div>
                    <div className="text-sm mt-2">Support and help documentation will go here...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </MainLayout >
      </div >
    </>
  );
};

export default Dashboard;