import http from 'http';

// Generate unique test email
const ts = new Date().toISOString().replace(/[:.]/g, '');
const email = `test+${ts}@example.com`;

const body = JSON.stringify({
  fullName: 'Test User',
  country: 'TN',
  phoneNumber: '+216999999999',
  email,
  password: 'Pass123!',
});

console.log(`\n[TEST] Registration Test`);
console.log(`[INFO] Testing with email: ${email}`);
console.log(`[INFO] Sending POST request to /api/auth/register`);

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': body.length,
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`[RESPONSE] Status: ${res.statusCode}`);
    console.log(`[RESPONSE] Body:`);
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.log(data);
    }
    process.exit(0);
  });
});

req.on('error', (error: any) => {
  console.error('[ERROR]', error.message);
  console.error('[ERROR] Full error:', error);
  process.exit(1);
});

req.write(body);
req.end();

// Timeout after 10 seconds
setTimeout(() => {
  console.error('[ERROR] Request timeout');
  process.exit(1);
}, 10000);
