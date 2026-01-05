const http = require('http');
const port = 5000;
const server = http.createServer((req, res) => {
  console.log('[PLAIN] Request', req.method, req.url);
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({ ok: true }));
});
server.listen(port, '127.0.0.1', () => {
  console.log('[PLAIN] listening on 127.0.0.1 port', port);
});
server.on('error', (e) => {
  console.error('[PLAIN] server error', e);
});
