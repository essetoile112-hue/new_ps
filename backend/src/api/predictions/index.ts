import { Router, Request, Response } from 'express';
import AdvancedLSTMPredictor from '../../ml/advanced-lstm';
import sensorService from '../../services/sensor.service';
import { buildCompleteDataset } from '../../services/history.service';

const router = Router();
let predictor: AdvancedLSTMPredictor | null = null;

/**
 * POST /api/predictions/train
 * Train Advanced LSTM model with ALL historical sensor data
 */
router.post('/train', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    console.log('[Train] ========== STARTING ADVANCED LSTM TRAINING ==========');
    console.log('[Train] Step 1: Building dataset from Firebase...');

    // Get complete historical dataset from Firebase
    const buildStart = Date.now();
    let dataset;
    try {
      dataset = await buildCompleteDataset();
      console.log('[Train] ✅ buildCompleteDataset() returned successfully');
    } catch (buildErr: any) {
      console.error('[Train] ❌ buildCompleteDataset() FAILED:', buildErr.message);
      console.error('[Train] Stack:', buildErr.stack);
      throw new Error(`Failed to build dataset: ${buildErr.message}`);
    }

    const buildTime = Date.now() - buildStart;
    console.log(`[Train] ⏱️  Dataset built in ${buildTime}ms`);
    console.log(`[Train] 📊 Total points: ${dataset.total_points} from ${dataset.days} DAYS`);
    if (dataset.data.length > 0) {
      console.log(`[Train] 📋 First point: ${JSON.stringify(dataset.data[0])}`);
      console.log(`[Train] 📋 Last point: ${JSON.stringify(dataset.data[dataset.data.length - 1])}`);
    }

    console.log('[Train] Step 2: Validating data count...');
    if (dataset.total_points < 25) {
      console.log(`[Train] ❌ Not enough data: ${dataset.total_points} < 25`);
      return res.status(400).json({
        error: 'Not enough historical data. Need at least 25 readings for Advanced LSTM.',
        current: dataset.total_points,
        days: dataset.days,
      });
    }
    console.log(`[Train] ✅ Data validation passed (${dataset.total_points} >= 25)`);

    // Extract CO values from dataset
    console.log('[Train] Step 3: Extracting CO values...');
    const historicalData = dataset.data.map((reading: any) => reading.value || 0);
    console.log(`[Train] ✅ Extracted ${historicalData.length} values`);
    const minVal = Math.min(...historicalData);
    const maxVal = Math.max(...historicalData);
    const meanVal = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    console.log(`[Train] Value range: min=${minVal}, max=${maxVal}, mean=${meanVal.toFixed(2)}`);

    console.log('[Train] Step 4: Checking for NaN/Infinity...');
    // Check for valid data
    if (historicalData.some(v => !isFinite(v) || isNaN(v))) {
      console.log(`[Train] ❌ Invalid data detected (NaN or Infinity)`);
      return res.status(400).json({
        error: 'Invalid data in readings (NaN or Infinity values)',
        current: dataset.total_points,
      });
    }
    console.log('[Train] ✅ All values are valid (finite)');

    // Initialize predictor
    console.log('[Train] Step 5: Initializing predictor...');
    if (!predictor) {
      console.log('[Train] Creating new AdvancedLSTMPredictor...');
      try {
        predictor = new AdvancedLSTMPredictor();
        console.log('[Train] ✅ Predictor created successfully');
      } catch (predErr: any) {
        console.error('[Train] ❌ Failed to create predictor:', predErr.message);
        throw predErr;
      }
    } else {
      console.log('[Train] ℹ️ Reusing existing predictor instance');
    }

    // Train model
    console.log('[Train] Step 6: Starting model training...');
    console.log('[Train] Calling predictor.train()...');
    const trainStart = Date.now();
    try {
      console.log('[Train] ⏳ Training in progress (this may take 30-60 seconds)...');
      await predictor.train(historicalData);
      const trainTime = Date.now() - trainStart;
      console.log(`[Train] ✅ Training completed successfully in ${trainTime}ms (${(trainTime / 1000).toFixed(1)}s)`);
      console.log(`[Train] Total request time: ${Date.now() - startTime}ms`);
    } catch (trainError: any) {
      console.error('[Train] ❌ Training FAILED:', trainError.message);
      console.error('[Train] Stack trace:', trainError.stack);
      throw trainError;
    }

    console.log('[Train] ========== TRAINING COMPLETED SUCCESSFULLY ==========');

    res.json({
      success: true,
      message: 'Advanced LSTM model trained successfully with realistic variation generator',
      dataPoints: historicalData.length,
      daysUsed: dataset.days,
      trainingDate: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Train] ❌ Endpoint error:', error);
    console.error('[Train] Error message:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to train model',
      details: error.stack,
    });
  }
});

/**
 * GET /api/predictions/forecast?steps=168
 * Get future predictions with realistic variations (default: 7 days = 168 hours)
 */
router.get('/forecast', async (req: Request, res: Response) => {
  try {
    if (!predictor) {
      return res.status(400).json({
        error: 'Model not trained. Call /train endpoint first.',
      });
    }

    // Get complete historical data
    const dataset = await buildCompleteDataset();
    const historicalData = dataset.data.map((reading: any) => reading.value);

    if (historicalData.length === 0) {
      return res.status(400).json({ error: 'No historical data available' });
    }

    // Get forecast steps from query (default 168 = 7 days, max 336 = 14 days)
    const steps = Math.min(parseInt(req.query.steps as string) || 168, 336);

    // Get last reading date/time
    const lastReading = dataset.data[dataset.data.length - 1];
    const lastDate = new Date(lastReading.timestamp);

    console.log(`[Forecast] Generating ${steps} predictions with realistic variations...`);

    // Generate predictions with variations
    const prediction = await predictor.fullPrediction(historicalData, lastDate, steps);

    res.json({
      success: true,
      prediction: {
        future_values: prediction.future_values,
        future_dates: prediction.dates,
        accuracy: {
          mae: prediction.accuracy.mae.toFixed(4),
          rmse: prediction.accuracy.rmse.toFixed(4),
        },
      },
      generatedAt: new Date().toISOString(),
      stepsGenerated: steps,
    });
  } catch (error: any) {
    console.error('[Forecast] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/predictions/dispose
 * Clean up model memory
 */
router.post('/dispose', (req: Request, res: Response) => {
  try {
    if (predictor) {
      predictor.dispose();
      predictor = null;
    }

    res.json({
      success: true,
      message: 'Model disposed successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;