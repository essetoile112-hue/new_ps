import * as tf from '@tensorflow/tfjs';

interface HourlyPattern {
  hour: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

interface PredictionResult {
  future_values: number[];
  dates: string[];
  accuracy: {
    mae: number;
    rmse: number;
  };
}

/**
 * HYBRID PREDICTOR - Professional Solution
 * Combines LSTM trend prediction with seasonal patterns and intelligent noise
 * 
 * This approach:
 * 1. Learns overall trend with LSTM
 * 2. Analyzes hourly patterns in historical data
 * 3. Combines both for realistic predictions with natural peaks
 */
class HybridPredictor {
  private lstmModel: tf.LayersModel | null = null;
  private scaler: { min: number; max: number } = { min: 0, max: 1 };
  private hourlyPatterns: Map<number, HourlyPattern> = new Map();
  private readonly SEQ_LENGTH = 30;

  /**
   * Analyze hourly patterns from historical data
   * Extract mean, std, min, max for each hour of the day
   */
  private analyzeHourlyPatterns(
    data: number[],
    timestamps: Date[]
  ): Map<number, HourlyPattern> {
    const hourlyData: Map<number, number[]> = new Map();

    // Group data by hour of day
    for (let i = 0; i < data.length && i < timestamps.length; i++) {
      const hour = timestamps[i].getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(data[i]);
    }

    // Calculate statistics for each hour
    const patterns: Map<number, HourlyPattern> = new Map();
    for (let hour = 0; hour < 24; hour++) {
      const values = hourlyData.get(hour) || [];

      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
          values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
          values.length;
        const stdDev = Math.sqrt(variance);

        patterns.set(hour, {
          hour,
          mean,
          stdDev,
          min: Math.min(...values),
          max: Math.max(...values),
        });
      }
    }

    console.log(`[Hybrid] Analyzed hourly patterns for ${patterns.size} hours`);
    return patterns;
  }

  /**
   * Normalize data for LSTM
   */
  private normalizeData(data: number[]): {
    scaled: number[];
    min: number;
    max: number;
  } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const scaled = data.map((val) => (val - min) / range);
    console.log(
      `[Hybrid] Normalized: min=${min.toFixed(1)}, max=${max.toFixed(1)}`
    );

    return { scaled, min, max };
  }

  /**
   * Create sequences for LSTM
   */
  private createSequences(
    data: number[],
    seqLength: number
  ): { X: number[][][]; y: number[] } {
    const X: number[][][] = [];
    const y: number[] = [];

    for (let i = 0; i < data.length - seqLength; i++) {
      const sequence = data.slice(i, i + seqLength).map((val) => [val]);
      X.push(sequence);
      y.push(data[i + seqLength]);
    }

    console.log(
      `[Hybrid] Created ${X.length} sequences from ${data.length} points`
    );
    return { X, y };
  }

  /**
   * Build LSTM model - Professional architecture
   */
  private buildModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 50,
          returnSequences: true,
          inputShape: [this.SEQ_LENGTH, 1],
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 50,
          returnSequences: false,
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 25, activation: 'relu' }),
        tf.layers.dense({ units: 1 }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    console.log('[Hybrid] LSTM model built');
    return model;
  }

  /**
   * Train LSTM on trend
   */
  async trainLSTM(normalizedData: number[]): Promise<void> {
    const { X, y } = this.createSequences(normalizedData, this.SEQ_LENGTH);

    if (X.length < 2) {
      throw new Error('Not enough sequences for training');
    }

    let xTensor: tf.Tensor | null = null;
    let yTensor: tf.Tensor | null = null;

    try {
      xTensor = tf.tensor3d(X, [X.length, this.SEQ_LENGTH, 1]);
      yTensor = tf.tensor2d(y, [y.length, 1]);

      this.lstmModel = this.buildModel();

      console.log('[Hybrid] Training LSTM on trend...');
      const startTime = Date.now();

      await this.lstmModel.fit(xTensor, yTensor, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 25 === 0 || epoch === 99) {
              console.log(
                `[Hybrid] Epoch ${epoch + 1}/100: loss=${logs?.loss.toFixed(6)}`
              );
            }
          },
        },
      });

      const trainTime = Date.now() - startTime;
      console.log(`[Hybrid] ✅ LSTM training complete (${trainTime}ms)`);
    } finally {
      if (xTensor) xTensor.dispose();
      if (yTensor) yTensor.dispose();
    }
  }

  /**
   * Get hourly pattern adjustment
   */
  private getHourlyModulation(hour: number, range: number): number {
    const pattern = this.hourlyPatterns.get(hour);
    if (!pattern) return 0;

    // Normalize pattern mean to 0.5 baseline
    const baseline = 0.5;
    const normalized = (pattern.mean - this.scaler.min) / range;
    const modulation = normalized - baseline;

    return modulation * 0.5; // Scale modulation to 50% influence
  }

  /**
   * Main hybrid prediction with intelligent variation
   */
  async predict(
    historicalData: number[],
    dates: Date[],
    steps: number = 168
  ): Promise<number[]> {
    if (!this.lstmModel) {
      throw new Error('Model not trained');
    }

    console.log(`[Hybrid] Generating ${steps} hybrid predictions...`);

    const range = this.scaler.max - this.scaler.min || 1;
    const normalizedData = historicalData.map(
      (val) => (val - this.scaler.min) / range
    );

    let currentSequence = normalizedData.slice(-this.SEQ_LENGTH);
    const predictions: number[] = [];

    // Calculate data statistics for intelligent noise
    const dataMean =
      historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const dataVariance =
      historicalData.reduce((a, b) => a + Math.pow(b - dataMean, 2), 0) /
      historicalData.length;
    const dataStdDev = Math.sqrt(dataVariance);
    const noiseScale = dataStdDev * 0.15; // 15% of historical variation

    for (let i = 0; i < steps; i++) {
      try {
        // LSTM trend prediction
        const inputTensor = tf.tensor3d(
          [currentSequence.map((val) => [val])],
          [1, this.SEQ_LENGTH, 1]
        );

        const output = this.lstmModel.predict(inputTensor) as tf.Tensor;
        let lstmPrediction = (await output.data())[0];

        // Get hour for this prediction
        const currentDate = new Date(dates[dates.length - 1].getTime() + i * 60 * 60 * 1000);
        const hour = currentDate.getHours();

        // Get hourly pattern modulation
        const hourlyMod = this.getHourlyModulation(hour, range);

        // Add intelligent noise based on time of day
        const pattern = this.hourlyPatterns.get(hour);
        const patternVariance = pattern
          ? (pattern.stdDev / (this.scaler.max - this.scaler.min)) * 0.3
          : noiseScale * 0.1;
        const noise = (Math.random() - 0.5) * patternVariance;

        // Combine: LSTM trend + hourly pattern + intelligent noise
        let finalPrediction = lstmPrediction + hourlyMod + noise;

        // Clip to reasonable range
        finalPrediction = Math.max(0.1, Math.min(0.9, finalPrediction));

        const denormalized =
          finalPrediction * range + this.scaler.min;
        predictions.push(Math.max(0, denormalized));

        // Update sequence
        currentSequence = [...currentSequence.slice(1), finalPrediction];

        inputTensor.dispose();
        output.dispose();

        if ((i + 1) % 50 === 0) {
          console.log(
            `[Hybrid] Generated ${i + 1}/${steps} predictions`
          );
        }
      } catch (error) {
        console.error(`[Hybrid] Error at step ${i}:`, error);
        throw error;
      }
    }

    const minPred = Math.min(...predictions);
    const maxPred = Math.max(...predictions);
    const avgPred =
      predictions.reduce((a, b) => a + b, 0) / predictions.length;
    console.log(
      `[Hybrid] ✅ Complete! Range: ${minPred.toFixed(1)} - ${maxPred.toFixed(1)}, Avg: ${avgPred.toFixed(1)}`
    );

    return predictions;
  }

  /**
   * Full training and prediction workflow
   */
  async train(historicalData: number[], timestamps: Date[]): Promise<void> {
    console.log(`[Hybrid] Training with ${historicalData.length} data points...`);

    if (historicalData.length < this.SEQ_LENGTH + 1) {
      throw new Error(
        `Need ${this.SEQ_LENGTH + 1} points, got ${historicalData.length}`
      );
    }

    // Analyze patterns
    this.hourlyPatterns = this.analyzeHourlyPatterns(
      historicalData,
      timestamps
    );

    // Normalize
    const { scaled, min, max } = this.normalizeData(historicalData);
    this.scaler = { min, max };

    // Train LSTM
    await this.trainLSTM(scaled);
  }

  /**
   * Full prediction with date generation
   */
  async fullPrediction(
    historicalData: number[],
    timestamps: Date[],
    lastDate: Date,
    steps: number
  ): Promise<PredictionResult> {
    const futureValues = await this.predict(historicalData, timestamps, steps);

    const dates: string[] = [];
    for (let i = 1; i <= steps; i++) {
      const futureDate = new Date(lastDate.getTime() + i * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];
      const timeStr = futureDate.toTimeString().slice(0, 5);
      dates.push(`${dateStr} ${timeStr}`);
    }

    // Calculate accuracy
    let accuracy = { mae: 0, rmse: 0 };
    if (historicalData.length > this.SEQ_LENGTH * 2) {
      try {
        const testSize = Math.min(30, historicalData.length - this.SEQ_LENGTH - 1);
        const testData = historicalData.slice(
          -testSize - this.SEQ_LENGTH,
          -testSize
        );
        const testTimestamps = timestamps.slice(
          timestamps.length - testSize - this.SEQ_LENGTH,
          timestamps.length - testSize
        );
        const testPred = await this.predict(testData, testTimestamps, testSize);
        const actual = historicalData.slice(-testSize);

        let mae = 0;
        let mse = 0;
        for (let i = 0; i < testSize; i++) {
          mae += Math.abs(actual[i] - testPred[i]);
          mse += Math.pow(actual[i] - testPred[i], 2);
        }
        accuracy.mae = mae / testSize;
        accuracy.rmse = Math.sqrt(mse / testSize);

        console.log(
          `[Hybrid] Accuracy: MAE=${accuracy.mae.toFixed(2)}, RMSE=${accuracy.rmse.toFixed(2)}`
        );
      } catch (err) {
        console.warn('[Hybrid] Could not calculate accuracy');
      }
    }

    return {
      future_values: futureValues.map((v) => Math.round(v * 100) / 100),
      dates,
      accuracy,
    };
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.lstmModel) {
      this.lstmModel.dispose();
      this.lstmModel = null;
    }
    this.hourlyPatterns.clear();
    console.log('[Hybrid] Model disposed');
  }
}

export default HybridPredictor;
