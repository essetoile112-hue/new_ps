import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/main-layout';
import { useHistoryByDay, useAvailableDays, useDaySummary, transformSensorReadingsToChartData } from '../hooks/useSensorData';
import { ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Calendar, Download, TrendingUp, TrendingDown, Activity, Clock, AlertCircle, ArrowLeft } from 'lucide-react';

export const HistoricalDataPage = () => {
  const navigate = useNavigate();

  // Helper to get local date in YYYY-MM-DD format (not UTC)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { days, loading: daysLoading } = useAvailableDays();
  const [selectedDate, setSelectedDate] = useState < string > (() => {
    return getLocalDateString(); // Use local date, not UTC
  });

  const { readings, loading: readingsLoading, error: readingsError } = useHistoryByDay(selectedDate);
  const { summary } = useDaySummary(selectedDate);

  // Auto-update date at midnight (00:00 local time)
  useEffect(() => {
    // Set initial date to today (local time)
    setSelectedDate(getLocalDateString());

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule update at midnight
    const timer = setTimeout(() => {
      setSelectedDate(getLocalDateString());
      // Reschedule for next day
      const nextMidnightTimer = setInterval(() => {
        setSelectedDate(getLocalDateString());
      }, 24 * 60 * 60 * 1000); // Every 24 hours

      return () => clearInterval(nextMidnightTimer);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  // Transform readings to chart data
  const chartData = readings.length > 0 ? transformSensorReadingsToChartData(readings) : [];

  // Calculate hourly averages for heatmap
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourReadings = readings.filter(r => {
      const h = new Date(r.timestamp).getHours();
      return h === hour;
    });

    if (hourReadings.length === 0) {
      return { hour: `${String(hour).padStart(2, '0')}:00`, co: null, count: 0 };
    }

    const avgCO = hourReadings.reduce((sum, r) => sum + r.value, 0) / hourReadings.length;
    return {
      hour: `${String(hour).padStart(2, '0')}:00`,
      co: avgCO,
      count: hourReadings.length,
      hasEmissions: hourReadings.some(r => r.gaz_detecte),
    };
  });

  // Statistics
  const stats = readings.length > 0 ? {
    min: Math.min(...readings.map(r => r.value)),
    max: Math.max(...readings.map(r => r.value)),
    avg: readings.reduce((sum, r) => sum + r.value, 0) / readings.length,
    totalReadings: readings.length,
    // Count hours that have any measurements (regardless of gaz_detecte)
    measuredHours: [...new Set(readings.map(r => new Date(r.timestamp).getHours()))],
  } : null;

  // Export to CSV
  const exportToCSV = () => {
    if (readings.length === 0) return;

    const headers = ['Date', 'Heure', 'CO (ppm)', 'Température (°C)', 'Humidité (%)', 'Gaz Détecté', 'Capteur Connecté'];
    const rows = readings.map(r => [
      r.date,
      r.time,
      r.value.toFixed(2),
      r.temperature?.toFixed(1) ?? 'N/A',
      r.humidity?.toFixed(1) ?? 'N/A',
      r.gaz_detecte ? 'Oui' : 'Non',
      r.sensor_connected ? 'Oui' : 'Non',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emissions_${selectedDate}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <ArrowLeft size={18} />
                Retour
              </button>
              <div>
                <h1 className="font-outfit text-4xl font-bold text-slate-800">Historique des Émissions</h1>
                <p className="text-sm text-slate-500 mt-1">Analyse détaillée par jour depuis le 19/12/2025</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              disabled={readings.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Download size={18} />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <Calendar className="text-emerald-600" size={24} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sélectionnez un jour
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {daysLoading ? (
                  <option>Chargement...</option>
                ) : (() => {
                  // Always include today's date in the list, even if it doesn't exist in Firebase yet
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = String(now.getMonth() + 1).padStart(2, '0');
                  const day = String(now.getDate()).padStart(2, '0');
                  const today = `${year}-${month}-${day}`; // Use local date, not UTC
                  const allDays = [...new Set([today, ...days])].sort((a, b) => b.localeCompare(a));

                  return allDays.map(day => (
                    <option key={day} value={day}>
                      {new Date(day).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Moyenne</p>
                  <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.avg.toFixed(1)} <span className="text-lg">ppm</span></p>
                </div>
                <Activity className="text-emerald-600" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Minimum</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.min.toFixed(1)} <span className="text-lg">ppm</span></p>
                </div>
                <TrendingDown className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-rose-700 font-medium">Maximum</p>
                  <p className="text-3xl font-bold text-rose-900 mt-1">{stats.max.toFixed(1)} <span className="text-lg">ppm</span></p>
                </div>
                <TrendingUp className="text-rose-600" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Heures mesurées</p>
                  <p className="text-3xl font-bold text-amber-900 mt-1">{stats.measuredHours.length} <span className="text-lg">h</span></p>
                </div>
                <Clock className="text-amber-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Évolution des Émissions</h2>
          {readingsLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-slate-500">Chargement des données...</div>
            </div>
          ) : readingsError ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle size={20} />
                <span>Erreur: {readingsError}</span>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-slate-500">Aucune donnée disponible pour ce jour</div>
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="coGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'CO (ppm)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                    labelFormatter={(ts) => new Date(ts).toLocaleString('fr-FR')}
                    formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : 'N/A'}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="co"
                    stroke="#10b981"
                    fill="url(#coGradient)"
                    strokeWidth={2}
                    name="CO (ppm)"
                  />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Température (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Humidité (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Hourly Heatmap */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Distribution Horaire</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis label={{ value: 'CO moyen (ppm)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'co') return value != null ? `${value.toFixed(2)} ppm` : 'Aucune donnée';
                    return value;
                  }}
                />
                <Bar
                  dataKey="co"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  name="CO moyen"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table - Grouped by Hour */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Données par Heure</h2>
            <span className="text-sm text-slate-500">
              {readings.length} mesures au total
            </span>
          </div>

          {readings.length === 0 && !readingsLoading ? (
            <div className="py-12 text-center text-slate-500">
              Aucune donnée disponible pour ce jour
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {/* Group readings by hour */}
              {Array.from({ length: 24 }, (_, hour) => {
                const hourReadings = readings.filter(r => {
                  const rHour = new Date(r.timestamp).getHours();
                  return rHour === hour;
                });

                if (hourReadings.length === 0) return null;

                const hourStats = {
                  min: Math.min(...hourReadings.map(r => r.value)),
                  max: Math.max(...hourReadings.map(r => r.value)),
                  avg: hourReadings.reduce((sum, r) => sum + r.value, 0) / hourReadings.length,
                  avgTemp: hourReadings.reduce((sum, r) => sum + (r.temperature || 0), 0) / hourReadings.length,
                  avgHum: hourReadings.reduce((sum, r) => sum + (r.humidity || 0), 0) / hourReadings.length,
                  hasAlert: hourReadings.some(r => r.value > 50),
                };

                return (
                  <details key={hour} className="group border border-slate-200 rounded-lg overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 cursor-pointer hover:from-slate-100 hover:to-slate-150 transition select-none">
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-lg text-slate-800 w-16">
                          {String(hour).padStart(2, '0')}:00
                        </span>
                        <span className="text-sm text-slate-600">
                          {hourReadings.length} mesure{hourReadings.length > 1 ? 's' : ''}
                        </span>
                        {hourStats.hasAlert && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                            ⚠️ Alerte
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <span className="text-slate-500">CO moy.</span>
                          <p className="font-semibold text-emerald-700">{hourStats.avg.toFixed(1)} ppm</p>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-500">Min/Max</span>
                          <p className="font-semibold text-slate-700">{hourStats.min.toFixed(0)}-{hourStats.max.toFixed(0)}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-500">Temp</span>
                          <p className="font-semibold text-blue-600">{hourStats.avgTemp.toFixed(1)}°C</p>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-500">Hum</span>
                          <p className="font-semibold text-sky-600">{hourStats.avgHum.toFixed(0)}%</p>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </summary>

                    <div className="border-t border-slate-200 bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Heure</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-600">CO (ppm)</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-600">Temp (°C)</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-600">Humidité (%)</th>
                            <th className="px-4 py-2 text-center font-medium text-slate-600">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {hourReadings.slice(0, 20).map((reading, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-mono text-slate-700">{reading.time}</td>
                              <td className={`px-4 py-2 text-right font-semibold ${reading.value > 50 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                {reading.value.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right text-slate-600">{reading.temperature?.toFixed(1) ?? '—'}</td>
                              <td className="px-4 py-2 text-right text-slate-600">{reading.humidity?.toFixed(1) ?? '—'}</td>
                              <td className="px-4 py-2 text-center">
                                {reading.value > 50 ? (
                                  <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs">Alerte</span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-xs">Normal</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {hourReadings.length > 20 && (
                        <div className="px-4 py-2 text-center text-sm text-slate-500 bg-slate-50 border-t">
                          Affichage de 20 sur {hourReadings.length} mesures pour cette heure
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default HistoricalDataPage;
