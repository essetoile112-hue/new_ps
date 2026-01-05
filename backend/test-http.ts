import http from 'http';

console.log('[INFO] Creating server...');

const server = http.createServer((req, res) => {
  console.log('[REQ]', req.method, req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

console.log('[INFO] Starting to listen...');

server.listen(5002, () => {
  console.log('[SUCCESS] Listening on port 5002');
  
  // Test from within the process
  console.log('[INFO] Making internal request...');
  http.get('http://localhost:5002/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('[RESPONSE]', res.statusCode, data);
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('[ERROR] Request failed:', err.message);
    process.exit(1);
  });
});

server.on('error', (err) => {
  console.error('[SERVER ERROR]', err);
  process.exit(1);
});

// Keep process alive for a while
setTimeout(() => {
  console.log('[INFO] Timeout - exiting');
  process.exit(0);
}, 5000);
