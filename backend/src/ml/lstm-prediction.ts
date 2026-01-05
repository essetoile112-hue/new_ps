import * as tf from '@tensorflow/tfjs';

interface PredictionResult {
  future_values: number[];
  dates: string[];
  accuracy: {
    mae: number;
    rmse: number;
  };
}

/**
 * LSTM Predictor - Professional version based on U4GA.ipynb notebook
 * Simplified and robust implementation for CO emission prediction
 */
class LSTMPredictor {
  private model: tf.LayersModel | null = null;
  private scaler: { min: number; max: number } = { min: 0, max: 1 };
  private readonly SEQ_LENGTH = 30; // Professional sequence length from notebook

  /**
   * Normalize data using MinMax scaling (0-1)
   */
  private normalizeData(data: number[]): { scaled: number[]; min: number; max: number } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const scaled = data.map((val) => (val - min) / range);

    console.log(`[LSTM] Normalized: min=${min.toFixed(1)}, max=${max.toFixed(1)}, range=${range.toFixed(1)}`);

    return { scaled, min, max };
  }

  /**
   * Create sequences for LSTM (exactly like notebook)
   * Input: [t-SEQ_LENGTH, ..., t-1, t]
   * Output: predict t+1
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

    console.log(`[LSTM] Created ${X.length} sequences from ${data.length} data points`);

    return { X, y };
  }

  /**
   * Build LSTM model exactly like U4GA.ipynb
   * LSTM(50) → Dropout(0.2) → LSTM(50) → Dropout(0.2) → Dense(25) → Dense(1)
   */
  private buildModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 50,
          activation: 'relu',
          returnSequences: true,
          inputShape: [this.SEQ_LENGTH, 1],
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 50,
          activation: 'relu',
          returnSequences: false,
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 25, activation: 'relu' }),
        tf.layers.dense({ units: 1 }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    console.log('[LSTM] Model built successfully');
    return model;
  }

  /**
   * Train LSTM model with ALL historical data
   */
  async train(historicalData: number[]): Promise<void> {
    console.log(`[LSTM] Starting training with ${historicalData.length} data points...`);

    if (historicalData.length < this.SEQ_LENGTH + 1) {
      throw new Error(
        `Insufficient data: need ${this.SEQ_LENGTH + 1} points, got ${historicalData.length}`
      );
    }

    // Step 1: Normalize data
    const { scaled, min, max } = this.normalizeData(historicalData);
    this.scaler = { min, max };

    // Step 2: Create sequences
    const { X, y } = this.createSequences(scaled, this.SEQ_LENGTH);

    if (X.length < 2) {
      throw new Error('Not enough sequences created for training');
    }

    console.log(`[LSTM] Training set: ${X.length} sequences, ${y.length} targets`);

    // Step 3: Convert to tensors safely
    let xTensor: tf.Tensor<tf.Rank> | null = null;
    let yTensor: tf.Tensor<tf.Rank> | null = null;

    try {
      // Create tensor3d for X: [sequences, timesteps, features]
      xTensor = tf.tensor3d(X, [X.length, this.SEQ_LENGTH, 1]);
      // Create tensor2d for y: [sequences, 1]
      yTensor = tf.tensor2d(y, [y.length, 1]);

      console.log(
        `[LSTM] Tensors created: X ${xTensor.shape}, y ${yTensor.shape}`
      );

      // Step 4: Build model
      this.model = this.buildModel();

      // Step 5: Train model
      console.log('[LSTM] Starting model.fit()...');
      const startTime = Date.now();

      await this.model.fit(xTensor, yTensor, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0 || epoch === 99) {
              console.log(
                `[LSTM] Epoch ${epoch + 1}/100: loss=${logs?.loss.toFixed(6)}, val_loss=${logs?.val_loss?.toFixed(6)}`
              );
            }
          },
        },
      });

      const trainTime = Date.now() - startTime;
      console.log(`[LSTM] ✅ Training complete in ${trainTime}ms`);
    } catch (error) {
      console.error('[LSTM] ❌ Training error:', error);
      throw error;
    } finally {
      // Always cleanup tensors
      if (xTensor) {
        xTensor.dispose();
      }
      if (yTensor) {
        yTensor.dispose();
      }
    }
  }

  /**
   * Generate predictions iteratively
   * Feed each prediction back as input for next prediction
   */
  async predict(historicalData: number[], steps: number = 168): Promise<number[]> {
    if (!this.model) {
      throw new Error('Model not trained. Call train() first.');
    }

    console.log(
      `[LSTM] Generating ${steps} predictions using iterative method...`
    );

    // Normalize using stored scaler
    const range = this.scaler.max - this.scaler.min || 1;
    const normalizedData = historicalData.map(
      (val) => (val - this.scaler.min) / range
    );

    // Start with last SEQ_LENGTH points
    let currentSequence = normalizedData.slice(-this.SEQ_LENGTH);
    const predictions: number[] = [];

    console.log(
      `[LSTM] Starting sequence: [${currentSequence.map((v) => v.toFixed(3)).join(', ')}]`
    );

    // Generate predictions one by one
    for (let i = 0; i < steps; i++) {
      try {
        // Reshape sequence: [1, SEQ_LENGTH, 1]
        const inputTensor = tf.tensor3d(
          [currentSequence.map((val) => [val])],
          [1, this.SEQ_LENGTH, 1]
        );

        // Predict
        const output = this.model.predict(inputTensor) as tf.Tensor;
        const predictionValue = (await output.data())[0];

        // Denormalize
        const denormalizedValue =
          predictionValue * range + this.scaler.min;

        predictions.push(Math.max(0, denormalizedValue)); // Ensure non-negative

        // Prepare next sequence by removing first and adding prediction
        currentSequence = [
          ...currentSequence.slice(1),
          predictionValue,
        ];

        // Cleanup
        inputTensor.dispose();
        output.dispose();

        if ((i + 1) % 50 === 0) {
          console.log(`[LSTM] Generated ${i + 1}/${steps} predictions`);
        }
      } catch (error) {
        console.error(`[LSTM] Error at prediction step ${i}:`, error);
        throw error;
      }
    }

    const minPred = Math.min(...predictions);
    const maxPred = Math.max(...predictions);
    console.log(
      `[LSTM] ✅ Predictions complete. Range: ${minPred.toFixed(2)} - ${maxPred.toFixed(2)}`
    );

    return predictions;
  }

  /**
   * Full prediction workflow
   */
  async fullPrediction(
    historicalData: number[],
    lastDate: Date,
    steps: number
  ): Promise<PredictionResult> {
    // Generate predictions
    const futureValues = await this.predict(historicalData, steps);

    // Generate future dates (hourly)
    const dates: string[] = [];
    for (let i = 1; i <= steps; i++) {
      const futureDate = new Date(lastDate.getTime() + i * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];
      const timeStr = futureDate.toTimeString().slice(0, 5);
      dates.push(`${dateStr} ${timeStr}`);
    }

    // Calculate metrics (MAE, RMSE) on last 20 points if possible
    let accuracy = { mae: 0, rmse: 0 };
    if (historicalData.length > this.SEQ_LENGTH * 2) {
      try {
        const testSize = Math.min(20, historicalData.length - this.SEQ_LENGTH - 1);
        const testData = historicalData.slice(-testSize - this.SEQ_LENGTH, -testSize);
        const testPred = await this.predict(testData, testSize);
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
          `[LSTM] Accuracy: MAE=${accuracy.mae.toFixed(2)}, RMSE=${accuracy.rmse.toFixed(2)}`
        );
      } catch (err) {
        console.warn('[LSTM] Could not calculate accuracy:', err);
      }
    }

    return {
      future_values: futureValues.map((v) => Math.round(v * 100) / 100),
      dates,
      accuracy,
    };
  }

  /**
   * Cleanup model
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    console.log('[LSTM] Model disposed');
  }
}

export default LSTMPredictor;
