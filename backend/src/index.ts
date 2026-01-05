import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Initialize Firebase FIRST before anything else
console.log('[0] Initializing Firebase...');
import './config/firebase.config';
console.log('[0.5] Firebase initialized');

import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './api/auth/index';
// import electricityRoutes from './api/electricitymaps';
import sensorRoutes from './api/sensors/index';
import predictionsRoutes from './api/predictions/index';
import cors from 'cors';
import { createServer } from 'http';
import { setupWebSocketServer } from './ws/server';

console.log('[1] Imports complete');
console.log('[PID]', process.pid);

const app = express();
console.log('[2] Express app created');

const httpServer = createServer(app);
console.log('[3] HTTP server created');

const port = process.env.PORT || 5000;

app.use(bodyParser.json());
console.log('[4] Body parser middleware added');

// Allow the frontend origin(s). In development we often run Vite on 5173 or 5183.
// When ALLOW_LAN=true we will bind to 0.0.0.0 and allow cross-origin requests
// from the network for easier testing on phones. This is unsafe for production.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5183',
  'http://localhost:5184',
  'http://localhost:5185',
];

const allowLan = process.env.ALLOW_LAN === 'true';
if (allowLan) console.warn('[WARN] ALLOW_LAN=true: backend will bind to 0.0.0.0 and allow network CORS (dev only)');

app.use(
  cors(
    allowLan
      ? // when allowing LAN for dev, reflect origin for CORS so browsers can send credentials
      { origin: true, credentials: false }
      : {
        origin: (origin, callback) => {
          // allow requests with no origin (e.g. curl, mobile apps, same-origin)
          if (!origin) return callback(null, true);
          // allow explicit configured origins
          if (allowedOrigins.includes(origin)) return callback(null, true);
          // allow any localhost dev origin (http://localhost:PORT)
          try {
            const url = new URL(origin);
            if (url.hostname === 'localhost') return callback(null, true);
          } catch (e) {
            // ignore parse errors
          }
          return callback(new Error('CORS origin not allowed'), false);
        },
        credentials: true,
      },
  ),
);
console.log('[5] CORS middleware added');

// Routes
app.use('/api/auth', authRoutes);
console.log('[6] Auth routes registered');

// app.use('/api/electricitymaps', electricityRoutes);
// console.log('[6.5] ElectricityMaps proxy routes registered');

app.use('/api/sensors', sensorRoutes);
console.log('[6.7] Sensor routes registered');

app.use('/api/predictions', predictionsRoutes);
console.log('[6.8] Prediction routes registered');

// Setup WebSocket server
console.log('[7] Setting up WebSocket server...');
const wsServer = setupWebSocketServer(httpServer);
console.log('[8] WebSocket server setup complete');

// Export so other routes can use it to broadcast messages
app.locals.wsServer = wsServer;

app.get('/', (req, res) => res.json({ ok: true, message: 'U4-Green-Africa backend' }));
console.log('[9] Root route registered');

const bindHost = allowLan ? '0.0.0.0' : '0.0.0.0'; // Always bind to 0.0.0.0 for local development
console.log(`[10] Starting httpServer.listen on ${bindHost}...`);
httpServer.listen(Number(port), bindHost, () => {
  // eslint-disable-next-line no-console
  console.log(`[LISTENING] Backend server listening on http://${bindHost}:${port}`);
  // eslint-disable-next-line no-console
  console.log(`[LISTENING] WebSocket server listening on ws://${bindHost}:${port}/ws`);
  // Print actual bound address info
  try {
    const addr = httpServer.address();
    // eslint-disable-next-line no-console
    console.log('[ADDR]', addr);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[ADDR ERROR]', e && e.message ? e.message : e);
  }
});
console.log('[11] listen() called, listening for connections');

httpServer.on('error', (err: any) => {
  // eslint-disable-next-line no-console
  console.error('[SERVER ERROR]', err.message);
  process.exit(1);
});

httpServer.on('close', () => {
  // eslint-disable-next-line no-console
  console.log('[SERVER CLOSED]');
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason);
});

export default app;
