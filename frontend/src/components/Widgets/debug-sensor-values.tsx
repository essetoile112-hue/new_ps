import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DebugSensorValuesProps {
  gasData?: any;
  dhtData?: any;
  chosenValue?: number;
  timestamp?: number;
}

/**
 * Debug component to display raw Firebase sensor values in real-time
 * Shows concentration_relative, valeur_analogique, gaz_detecte, temperature, humidity
 */
export const DebugSensorValues: React.FC<DebugSensorValuesProps> = ({
  gasData,
  dhtData,
  chosenValue,
  timestamp,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!gasData && !dhtData) {
    return null;
  }

  const concentrationRelative = gasData?.concentration_relative ?? null;
  const valeurAnalogique = gasData?.valeur_analogique ?? null;
  const tension = gasData?.tension_mesuree ?? null;
  const gazDetecte = gasData?.gaz_detecte ?? false;
  const temperature = dhtData?.temperature ?? null;
  const humidity = dhtData?.humidity ?? null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700 p-3 max-w-sm">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="text-xs font-bold uppercase tracking-wider">🔍 Debug Sensor</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs font-mono border-t border-slate-700 pt-2">
          {/* Concentration Relative */}
          <div className="flex justify-between">
            <span className="text-emerald-400">concentration_relative:</span>
            <span className={concentrationRelative === null ? 'text-red-400' : 'text-blue-400'}>
              {concentrationRelative !== null ? `${concentrationRelative.toFixed(2)}%` : 'null'}
            </span>
          </div>

          {/* Valeur Analogique */}
          <div className="flex justify-between">
            <span className="text-emerald-400">valeur_analogique:</span>
            <span className={valeurAnalogique === null ? 'text-red-400' : 'text-blue-400'}>
              {valeurAnalogique !== null ? valeurAnalogique : 'null'}
            </span>
          </div>

          {/* Tension */}
          <div className="flex justify-between">
            <span className="text-emerald-400">tension_mesuree:</span>
            <span className={tension === null ? 'text-red-400' : 'text-blue-400'}>
              {tension !== null ? `${tension.toFixed(2)}V` : 'null'}
            </span>
          </div>

          {/* Gaz Detecté */}
          <div className="flex justify-between">
            <span className="text-emerald-400">gaz_detecte:</span>
            <span className={gazDetecte ? 'text-red-500 font-bold' : 'text-yellow-400'}>
              {gazDetecte ? '⚠️ YES' : 'No'}
            </span>
          </div>

          {/* Temperature */}
          <div className="flex justify-between">
            <span className="text-emerald-400">temperature:</span>
            <span className={temperature === null ? 'text-red-400' : 'text-blue-400'}>
              {temperature !== null ? `${temperature.toFixed(1)}°C` : 'null'}
            </span>
          </div>

          {/* Humidity */}
          <div className="flex justify-between">
            <span className="text-emerald-400">humidity:</span>
            <span className={humidity === null ? 'text-red-400' : 'text-blue-400'}>
              {humidity !== null ? `${humidity.toFixed(1)}%` : 'null'}
            </span>
          </div>

          {/* Chosen Value (what the UI uses) */}
          <div className="flex justify-between bg-slate-800 p-2 rounded mt-2 border border-slate-600">
            <span className="text-yellow-300 font-bold">Chosen Value (displayed):</span>
            <span className="text-yellow-300 font-bold">{chosenValue !== undefined ? `${chosenValue.toFixed(2)}` : '—'}</span>
          </div>

          {/* Timestamp */}
          <div className="flex justify-between text-gray-400 text-xs mt-2">
            <span>Last update:</span>
            <span>
              {timestamp ? new Date(timestamp).toLocaleTimeString() : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
