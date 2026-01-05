import React, { useState } from 'react';
import { ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, Zap } from 'lucide-react';

interface PredictionData {
  future_values: number[];
  future_dates: string[];
  accuracy: {
    mae: string;
    rmse: string;
  };
}

interface PredictionChartProps {
  historicalData?: Array<{ time: string; co: number }>;
  height?: number | string;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({ historicalData = [], height = 400 }) => {
  const [prediction, setPrediction] = useState < PredictionData | null > (null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState < string | null > (null);
  const [trained, setTrained] = useState(false);

  const handleTrain = async () => {
    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);
      setPrediction(null);
      setTrained(false);
      console.log('[PredictionChart] Starting training...');

      // Create abort controller with 300 second timeout (professional 100-epoch training)
      timeoutId = setTimeout(() => {
        console.warn('[PredictionChart] Training timeout reached, aborting request');
        controller.abort();
      }, 300000);

      const response = await fetch('/api/predictions/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Backend fetches from Firebase directly
        signal: controller.signal,
      });

      // Always clear timeout first thing after response
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to train model' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[PredictionChart] Training successful:', result);
      setTrained(true);
      setError(null);
    } catch (err: any) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;

      // Don't show error if abort was intentional (timeout)
      if (err.name === 'AbortError') {
        console.error('[PredictionChart] Training aborted due to timeout');
        setError('Training server is taking too long. Check if backend is running and Firebase is connected.');
      } else {
        console.error('[PredictionChart] Training error:', err);
        setError(err.message || 'Training failed');
      }
    } finally {
      // Ensure timeout is always cleaned up
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);
      console.log('[PredictionChart] Starting prediction for 7 days (168 hours)...');

      // Create abort controller with 120 second timeout for predictions
      timeoutId = setTimeout(() => {
        console.warn('[PredictionChart] Prediction timeout reached, aborting request');
        controller.abort();
      }, 120000);

      const response = await fetch('/api/predictions/forecast?steps=168', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      // Always clear timeout first thing after response
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate predictions' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[PredictionChart] Prediction result:', result);

      if (!result.prediction) {
        throw new Error('Invalid response format from server');
      }

      setPrediction(result.prediction);
      console.log(`[PredictionChart] Generated ${result.prediction.future_values.length} predictions`);
      setError(null);
    } catch (err: any) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;

      // Don't show error if abort was intentional (timeout)
      if (err.name === 'AbortError') {
        console.error('[PredictionChart] Prediction aborted due to timeout');
        setError('Prediction generation took too long. Please try again.');
      } else {
        console.error('[PredictionChart] Prediction error:', err);
        setError(err.message || 'Prediction failed');
      }
    } finally {
      // Ensure timeout is always cleaned up
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Combine historical and predicted data
  const chartData: any[] = historicalData.map((h) => ({
    ...h,
    predicted: null,
    type: 'historical',
  }));

  if (prediction) {
    prediction.future_values.forEach((value, i) => {
      chartData.push({
        time: prediction.future_dates[i],
        co: null,
        predicted: value,
        type: 'predicted',
      });
    });
  }

  return (
    <div className="glass-panel p-8 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">CO Emissions Prediction</h2>
          <p className="text-sm text-gray-600">AI-powered forecasting using LSTM</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTrain}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Zap size={16} />
            {loading && trained === false ? 'Training...' : 'Train Model'}
          </button>

          <button
            onClick={handlePredict}
            disabled={loading || !trained}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Zap size={16} />
            {loading && trained ? 'Predicting...' : 'Predict'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {trained && !prediction && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
          ✓ Model trained successfully with all historical data. Click "Predict" to generate 7-day forecast.
        </div>
      )}

      {prediction && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600">Mean Absolute Error</div>
            <div className="text-lg font-bold text-blue-600">{prediction.accuracy.mae}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-600">Root Mean Squared Error</div>
            <div className="text-lg font-bold text-green-600">{prediction.accuracy.rmse}</div>
          </div>
        </div>
      )}

      <div style={{ height: height as number }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
              tickFormatter={(time) => {
                // For predictions with dates like "2025-12-20 14:00", show day/hour
                if (time.includes(' ')) {
                  const [date, hour] = time.split(' ');
                  const day = date.split('-')[2]; // Get DD from YYYY-MM-DD
                  return `${day}/${hour}`;
                }
                // For historical data with short time format
                return time.substring(0, 5);
              }}
            />
            <YAxis
              label={{ value: 'CO (ppm)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc' }}
              formatter={(value: any) =>
                typeof value === 'number' ? value.toFixed(2) : 'N/A'
              }
            />
            <Legend />

            {/* Historical Data */}
            <Area
              type="monotone"
              dataKey="co"
              stroke="#10b981"
              fill="rgba(16,185,129,0.2)"
              name="Actual Data"
              isAnimationActive={true}
            />

            {/* Predicted Data */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={2}
              name="Prediction"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>• <span className="text-green-600">Green area</span>: Historical sensor measurements from all days</p>
        <p>• <span className="text-yellow-600">Orange dashed line</span>: AI predictions for next 7 days (168 hours)</p>
        <p>• Click "Train Model" to train with all historical data, then "Predict" for 7-day forecast</p>
      </div>
    </div>
  );
};

export default PredictionChart;
