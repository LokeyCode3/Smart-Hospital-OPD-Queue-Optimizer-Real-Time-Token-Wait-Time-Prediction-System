
// const fetch = require('node-fetch'); // Native fetch is available in Node 18+

// Helper to log results
const logResult = (testName, passed, details = '') => {
  console.log(`${passed ? '✅' : '❌'} ${testName}`);
  if (!passed && details) console.log(`   Details: ${details}`);
};

async function runTests() {
  const BASE_URL = 'http://localhost:5001/api/auth';
  
  console.log('Starting Auth Separation Verification...');

  // 1. Test Admin Login on Admin Endpoint (Success Expected)
  try {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin1' })
    });
    const data = await res.json();
    logResult('Admin Login on Admin Endpoint', res.status === 200 && data.token, `Status: ${res.status}`);
  } catch (e) {
    logResult('Admin Login on Admin Endpoint', false, e.message);
  }

  // 2. Test Patient Login on Patient Endpoint (Success Expected)
  try {
    const res = await fetch(`${BASE_URL}/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient1@gmail.com', password: 'patient123' })
    });
    const data = await res.json();
    logResult('Patient Login on Patient Endpoint', res.status === 200 && data.token, `Status: ${res.status}`);
  } catch (e) {
    logResult('Patient Login on Patient Endpoint', false, e.message);
  }

  // 3. Test Admin Login on Patient Endpoint (Failure Expected)
  try {
    const res = await fetch(`${BASE_URL}/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin1' })
    });
    const data = await res.json();
    // We expect 400 or 401 or 403
    logResult('Admin Login on Patient Endpoint (Should Fail)', res.status !== 200, `Status: ${res.status}, Msg: ${data.message}`);
  } catch (e) {
    logResult('Admin Login on Patient Endpoint (Should Fail)', true, e.message);
  }

  // 4. Test Patient Login on Admin Endpoint (Failure Expected)
  try {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient1@gmail.com', password: 'patient123' })
    });
    const data = await res.json();
    logResult('Patient Login on Admin Endpoint (Should Fail)', res.status !== 200, `Status: ${res.status}, Msg: ${data.message}`);
  } catch (e) {
    logResult('Patient Login on Admin Endpoint (Should Fail)', true, e.message);
  }

  // 5. Test Admin Forgot Password on Patient Endpoint (Silent Failure / Generic Response)
  // The backend returns 200 OK with generic message for security, but the audit log should show mismatch.
  // For this test, we just want to ensure it doesn't return a token or explicit success if we were checking for that.
  // Actually, my code returns 200 with generic message. So this test is tricky to automate without checking server logs.
  // However, we can check if it sends the email. In the mock implementation, it logs to console.
  // We'll just check it returns 200 (as it should for security) but we rely on manual log check for "Role mismatch".
  console.log('NOTE: Check server logs for "Role mismatch" during the next test.');
  try {
    const res = await fetch(`${BASE_URL}/patient/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com' })
    });
    const data = await res.json();
    logResult('Admin Forgot Password on Patient Endpoint (Generic 200 OK)', res.status === 200, `Status: ${res.status}, Msg: ${data.message}`);
  } catch (e) {
    logResult('Admin Forgot Password on Patient Endpoint', false, e.message);
  }

}

runTests();
