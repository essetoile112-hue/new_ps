import express from 'express';
import { createServer } from 'http';

console.log('[INFO] Starting minimal test server...');

const app = express();
const httpServer = createServer(app);
const port = 5001;

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  console.log('[DEBUG] Root endpoint');
  res.json({ ok: true });
});

httpServer.listen(port, () => {
  console.log(`[SUCCESS] Test server listening on http://localhost:${port}`);
});

httpServer.on('error', (err) => {
  console.error('[ERROR]', err);
});
