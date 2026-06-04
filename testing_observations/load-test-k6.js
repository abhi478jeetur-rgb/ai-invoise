import http from 'k6/http';
import { check, sleep } from 'k6';

// ==========================================
// K6 LOAD TEST CONFIGURATION
// ==========================================
export const options = {
  stages: [
    { duration: '30s', target: 50 },     // Ramp up to 50 users
    { duration: '1m', target: 100 },     // Spike to 100 users (Max limit for Grafana Free Tier)
    { duration: '30s', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],   // 95% of requests must finish within 1.5s
    http_req_failed: ['rate<0.05'],      // Max 5% failure rate allowed
  },
};

// ==========================================
// ENVIRONMENT VARIABLES & CREDENTIALS
// ==========================================
const TARGET_URL = 'https://ai-invoise.vercel.app';
const SUPABASE_URL = 'https://hfwuvramwfwmyplynqyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmd3V2cmFtd2Z3bXlwbHlucXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzU5NDIsImV4cCI6MjA5NDY1MTk0Mn0.YQmN8YK_bDz5wPyGG-_hlSaPszjCzkiYBC32a7qSaQM';

const TEST_EMAIL = 'testabhi1@clockivo.com';
const TEST_PASSWORD = '***REMOVED***';

// ==========================================
// SETUP FUNCTION (Runs ONCE before the test starts)
// ==========================================
export function setup() {
  // 1. Generate JWT Token from Supabase using the Test Credentials
  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  // If login fails, crash the test immediately so we don't waste time
  if (loginRes.status !== 200) {
    throw new Error(`Auth Failed! Check credentials. Supabase returned: ${loginRes.body}`);
  }

  const authData = loginRes.json();
  
  // Pass this token to all 10,000 Virtual Users
  return { 
    accessToken: authData.access_token 
  };
}

// ==========================================
// VIRTUAL USER BEHAVIOR (Runs repeatedly for all 10,000 users)
// ==========================================// Main K6 function
export default function loadTest(data) {
  const token = data.accessToken;
  
  // Test landing page
  const res = http.get(TARGET_URL);

  // 1. STRESS TEST VERCEL (Frontend rendering)
  const vercelRes = http.get(`${TARGET_URL}/`);
  check(vercelRes, {
    'Vercel Homepage loaded (200)': (r) => r.status === 200,
  });

  sleep(1); // Wait 1 second like a real user

  // 2. STRESS TEST SUPABASE DB + RLS (Backend)
  // We hit the database directly with the Auth Token to simulate users fetching their invoices
  const supabaseRes = http.get(`${SUPABASE_URL}/rest/v1/invoices?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  
  check(supabaseRes, {
    'Supabase DB fetched invoices successfully (200)': (r) => r.status === 200,
  });

  sleep(1);
}
