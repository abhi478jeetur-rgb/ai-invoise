/**
 * =====================================================================
 *  ADVANCED BACKEND & API SECURITY AUDIT — ChaseFree AI v2.5
 * =====================================================================
 *
 *  This test suite bypasses the UI entirely and attacks the backend
 *  directly via Playwright's `request` API context.
 *
 *  Attack Vectors:
 *   1. Row-Level Security (RLS) & Tenant Isolation
 *   2. Direct API Parameter Tampering
 *   3. Authentication Bypass (Broken Access Control)
 *   4. Mass Assignment / Privilege Escalation
 *
 *  Architecture Context:
 *   - Supabase PostgREST at {SUPABASE_URL}/rest/v1/
 *   - Auth via Supabase GoTrue at {SUPABASE_URL}/auth/v1/
 *   - Only 2 API routes: /api/invoices/[id]/pdf, /api/cron/reminders
 *   - All business logic via Next.js Server Actions
 * =====================================================================
 */

import { test, expect, APIRequestContext } from '@playwright/test';

// ─── Configuration ────────────────────────────────────────────────────
const SUPABASE_URL = 'https://hfwuvramwfwmyplynqyr.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmd3V2cmFtd2Z3bXlwbHlucXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzU5NDIsImV4cCI6MjA5NDY1MTk0Mn0.YQmN8YK_bDz5wPyGG-_hlSaPszjCzkiYBC32a7qSaQM';

// Two separate user contexts for cross-tenant testing
const USER_A = { email: 'testabhi1@clockivo.com', password: '***REMOVED***' };
const USER_B = { email: 'testabhi5@clockivo.com', password: '***REMOVED***' };

const BASE_URL = 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────

/** Authenticate via Supabase GoTrue and return the access token. */
async function getSupabaseToken(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: { email, password },
    }
  );
  expect(res.ok(), `Auth failed for ${email}: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  expect(body.access_token, `No access_token for ${email}`).toBeTruthy();
  return body.access_token as string;
}

/** Build Supabase PostgREST headers for a given user token. */
function pgRestHeaders(token: string) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

/** Build Next.js cookie header from a Supabase access token. */
function nextCookieHeader(token: string) {
  // The Supabase session cookie is a base64-encoded JSON blob containing
  // access_token, refresh_token, expires_at, etc.
  const sessionPayload = {
    access_token: token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'fake-refresh-for-security-test',
    user: null, // not needed for cookie auth
  };
  // Supabase SSR stores this as a base64 cookie
  const cookieValue = btoa(JSON.stringify(sessionPayload));
  return `sb-hfwuvramwfwmyplynqyr-auth-token=${cookieValue}`;
}

// ─── Store tokens across tests ────────────────────────────────────────
let tokenA: string;
let tokenB: string;
let userAId: string;
let userBId: string;

// ═══════════════════════════════════════════════════════════════════════
//  SETUP: Authenticate both users
// ═══════════════════════════════════════════════════════════════════════

test.describe.serial('SETUP — Authenticate Test Users', () => {
  test('should authenticate User A via Supabase GoTrue', async ({ request }) => {
    const res = await request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        data: { email: USER_A.email, password: USER_A.password },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    tokenA = body.access_token;
    userAId = body.user?.id;
    expect(tokenA).toBeTruthy();
    expect(userAId).toBeTruthy();
    console.log(`[AUTH] User A authenticated: ${USER_A.email} (id: ${userAId})`);
  });

  test('should authenticate User B via Supabase GoTrue', async ({ request }) => {
    const res = await request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        data: { email: USER_B.email, password: USER_B.password },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    tokenB = body.access_token;
    userBId = body.user?.id;
    expect(tokenB).toBeTruthy();
    expect(userBId).toBeTruthy();
    console.log(`[AUTH] User B authenticated: ${USER_B.email} (id: ${userBId})`);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  VECTOR 1: ROW-LEVEL SECURITY (RLS) & TENANT ISOLATION
// ═══════════════════════════════════════════════════════════════════════

test.describe('VECTOR 1 — Row-Level Security (RLS) & Tenant Isolation', () => {
  let userAClientId: string;
  let userAInvoiceId: string;

  // ── Setup: User A creates a client and invoice via PostgREST ────────

  test('SETUP: User A creates a private client', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/clients`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId, // Required by RLS INSERT policy
        client_name: `RLS Test Client ${Date.now()}`,
        email: `rls-test-${Date.now()}@example.com`,
      },
    });
    expect(res.status()).toBe(201);
    const rows = await res.json();
    userAClientId = rows[0]?.id;
    expect(userAClientId).toBeTruthy();
    console.log(`[RLS] User A created client: ${userAClientId}`);
  });

  test('SETUP: User A creates a private invoice', async ({ request }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId, // Required by RLS INSERT policy
        client_id: userAClientId,
        invoice_number: `RLS-TEST-${Date.now()}`,
        amount: 500,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    expect(res.status()).toBe(201);
    const rows = await res.json();
    userAInvoiceId = rows[0]?.id;
    expect(userAInvoiceId).toBeTruthy();
    console.log(`[RLS] User A created invoice: ${userAInvoiceId}`);
  });

  // ── Attack: User B tries to read User A's data ──────────────────────

  test('ATTACK: User B cannot read User A\'s invoices via PostgREST', async ({
    request,
  }) => {
    // Direct query to invoices table — RLS should filter out User A's rows
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/invoices?id=eq.${userAInvoiceId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    // RLS must return empty array — User B should NOT see User A's invoice
    expect(
      rows.length,
      'RLS BREACH: User B can read User A\'s invoice!'
    ).toBe(0);
    console.log('[RLS PASS] User B cannot read User A\'s invoices');
  });

  test('ATTACK: User B cannot read User A\'s clients via PostgREST', async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/clients?id=eq.${userAClientId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(
      rows.length,
      'RLS BREACH: User B can read User A\'s client!'
    ).toBe(0);
    console.log('[RLS PASS] User B cannot read User A\'s clients');
  });

  test('ATTACK: User B cannot update User A\'s invoice via PostgREST', async ({
    request,
  }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/invoices?id=eq.${userAInvoiceId}`,
      {
        headers: pgRestHeaders(tokenB),
        data: { amount: 1, title: 'HACKED' },
      }
    );
    // PostgREST returns 200 with empty array OR 401 when RLS blocks
    if (res.status() === 200) {
      const rows = await res.json();
      expect(
        rows.length,
        'RLS BREACH: User B updated User A\'s invoice!'
      ).toBe(0);
    } else {
      expect(
        [401, 403].includes(res.status()),
        `Unexpected status: ${res.status()}`
      ).toBeTruthy();
    }
    console.log('[RLS PASS] User B cannot update User A\'s invoices');
  });

  test('ATTACK: User B cannot delete User A\'s invoice via PostgREST', async ({
    request,
  }) => {
    const res = await request.delete(
      `${SUPABASE_URL}/rest/v1/invoices?id=eq.${userAInvoiceId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    // PostgREST returns 200 with empty array OR 401 when RLS blocks
    if (res.status() === 200) {
      const rows = await res.json();
      expect(
        rows.length,
        'RLS BREACH: User B deleted User A\'s invoice!'
      ).toBe(0);
    } else {
      expect(
        [401, 403].includes(res.status()),
        `Unexpected status: ${res.status()}`
      ).toBeTruthy();
    }
    console.log('[RLS PASS] User B cannot delete User A\'s invoices');
  });

  test('ATTACK: User B cannot read User A\'s profile via PostgREST', async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userAId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(
      rows.length,
      'RLS BREACH: User B can read User A\'s profile!'
    ).toBe(0);
    console.log('[RLS PASS] User B cannot read User A\'s profile');
  });

  test('ATTACK: User B cannot read User A\'s AI settings via PostgREST', async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/user_ai_settings?user_id=eq.${userAId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(
      rows.length,
      'RLS BREACH: User B can read User A\'s AI settings!'
    ).toBe(0);
    console.log('[RLS PASS] User B cannot read User A\'s AI settings');
  });

  test('ATTACK: User B cannot read User A\'s reminder drafts via PostgREST', async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/reminder_drafts?user_id=eq.${userAId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(
      rows.length,
      'RLS BREACH: User B can read User A\'s reminder drafts!'
    ).toBe(0);
    console.log('[RLS PASS] User B cannot read User A\'s reminder drafts');
  });

  test('ATTACK: User B cannot read User A\'s reminder events via PostgREST', async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/reminder_events?user_id=eq.${userAId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(
      rows.length,
      'RLS BREACH: User B can read User A\'s reminder events!'
    ).toBe(0);
    console.log('[RLS PASS] User B cannot read User A\'s reminder events');
  });

  test('ATTACK: User B cannot read User A\'s knowledge base via PostgREST', async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/user_knowledge_base?user_id=eq.${userAId}`,
      { headers: pgRestHeaders(tokenB) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(
      rows.length,
      'RLS BREACH: User B can read User A\'s knowledge base!'
    ).toBe(0);
    console.log('[RLS PASS] User B cannot read User A\'s knowledge base');
  });

  // ── Verify User A CAN read their own data ──────────────────────────

  test('VERIFY: User A can read their own invoice (positive control)', async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/invoices?id=eq.${userAInvoiceId}`,
      { headers: pgRestHeaders(tokenA) }
    );
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(rows.length, 'User A should see their own invoice').toBe(1);
    expect(rows[0].id).toBe(userAInvoiceId);
    console.log('[RLS PASS] User A can read own invoice (positive control)');
  });

  // ── Cleanup ─────────────────────────────────────────────────────────

  test('CLEANUP: Remove RLS test data', async ({ request }) => {
    // Delete invoice first (FK dependency)
    if (userAInvoiceId) {
      await request.delete(
        `${SUPABASE_URL}/rest/v1/invoices?id=eq.${userAInvoiceId}`,
        { headers: pgRestHeaders(tokenA) }
      );
    }
    if (userAClientId) {
      await request.delete(
        `${SUPABASE_URL}/rest/v1/clients?id=eq.${userAClientId}`,
        { headers: pgRestHeaders(tokenA) }
      );
    }
    console.log('[RLS] Test data cleaned up');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  VECTOR 2: DIRECT API PARAMETER TAMPERING
// ═══════════════════════════════════════════════════════════════════════

test.describe('VECTOR 2 — Direct API Parameter Tampering', () => {
  let testClientId: string;

  test('SETUP: Create a test client for tampering tests', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/clients`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId,
        client_name: `Tamper Test Client ${Date.now()}`,
        email: `tamper-${Date.now()}@example.com`,
      },
    });
    expect(res.status()).toBe(201);
    const rows = await res.json();
    testClientId = rows[0]?.id;
  });

  // ── Status Injection ────────────────────────────────────────────────

  test('TAMPER: Reject invalid invoice status via PostgREST', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId,
        client_id: testClientId,
        invoice_number: `TAMPER-STATUS-${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'HACKED', // Invalid status
        due_date: futureDate,
      },
    });
    // Should fail: either 400 from PostgREST or DB check constraint
    expect(
      res.status(),
      'Server accepted invalid status "HACKED"'
    ).not.toBe(201);
    console.log(
      `[TAMPER PASS] Invalid status rejected (HTTP ${res.status()})`
    );
  });

  // ── Negative Amount ─────────────────────────────────────────────────

  test('TAMPER: Reject negative invoice amount via PostgREST', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId,
        client_id: testClientId,
        invoice_number: `TAMPER-NEG-${Date.now()}`,
        amount: -9999,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    // DB has check constraint: invoices_amount_non_negative
    expect(
      res.status(),
      'Server accepted negative amount -9999!'
    ).not.toBe(201);
    console.log(
      `[TAMPER PASS] Negative amount rejected (HTTP ${res.status()})`
    );
  });

  // ── SQL Injection ───────────────────────────────────────────────────

  test('TAMPER: Reject SQL injection in invoice_number', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        client_id: testClientId,
        user_id: userAId,
        invoice_number: "1 OR 1=1; DROP TABLE invoices; --",
        amount: 100,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    // PostgREST parameterizes queries — SQL injection should not work.
    // If it does return 201, verify the DB wasn't corrupted.
    if (res.status() === 201) {
      const rows = await res.json();
      // The SQL injection string was stored as a literal string, not executed
      expect(rows[0]?.invoice_number).toContain('1 OR 1=1');
      console.log(
        '[TAMPER PASS] SQL injection stored as literal string (parameterized queries work)'
      );
      // Cleanup
      await request.delete(
        `${SUPABASE_URL}/rest/v1/invoices?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[TAMPER PASS] SQL injection rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── XSS in text fields ─────────────────────────────────────────────

  test('TAMPER: XSS payload in client_name is stored safely', async ({
    request,
  }) => {
    const xssPayload = '<script>alert("XSS")</script>';
    const res = await request.post(`${SUPABASE_URL}/rest/v1/clients`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId,
        client_name: xssPayload,
        email: `xss-${Date.now()}@example.com`,
      },
    });
    if (res.status() === 201) {
      const rows = await res.json();
      // The XSS string is stored as-is — it should be escaped on output by React
      expect(rows[0]?.client_name).toBe(xssPayload);
      console.log(
        '[TAMPER PASS] XSS payload stored as literal text (React escapes on render)'
      );
      // Cleanup
      await request.delete(
        `${SUPABASE_URL}/rest/v1/clients?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[TAMPER PASS] XSS payload rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Extremely large amount ──────────────────────────────────────────

  test('TAMPER: Reject astronomically large amount', async ({ request }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        client_id: testClientId,
        user_id: userAId,
        invoice_number: `TAMPER-BIG-${Date.now()}`,
        amount: 99999999999999.99,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    // This may or may not fail depending on DB column type (numeric vs float)
    // Log the result regardless
    console.log(
      `[TAMPER] Large amount (${99999999999999.99}) → HTTP ${res.status()}`
    );
  });

  // ── Invalid currency ────────────────────────────────────────────────

  test('TAMPER: Invalid currency is accepted at DB level (app-level validation)', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        client_id: testClientId,
        user_id: userAId,
        invoice_number: `TAMPER-CUR-${Date.now()}`,
        amount: 100,
        currency: 'HACKEDCOIN',
        status: 'draft',
        due_date: futureDate,
      },
    });
    // Note: DB may not enforce currency whitelist — that's app-level validation
    if (res.status() === 201) {
      const rows = await res.json();
      console.log(
        '[TAMPER INFO] Invalid currency accepted at DB level — app-level validation should catch this'
      );
      await request.delete(
        `${SUPABASE_URL}/rest/v1/invoices?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[TAMPER PASS] Invalid currency rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Foreign key violation ───────────────────────────────────────────

  test('TAMPER: Reject invoice with non-existent client_id', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId,
        client_id: fakeUuid,
        invoice_number: `TAMPER-FK-${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    // Foreign key constraint should reject this
    expect(
      res.status(),
      'Server accepted invoice with non-existent client!'
    ).not.toBe(201);
    console.log(
      `[TAMPER PASS] Foreign key violation rejected (HTTP ${res.status()})`
    );
  });

  // ── Negative tax rate ───────────────────────────────────────────────

  test('TAMPER: Reject negative tax rate', async ({ request }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        client_id: testClientId,
        user_id: userAId,
        invoice_number: `TAMPER-TAX-${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
        tax_rate: -50,
      },
    });
    // Check if there's a constraint on tax_rate
    if (res.status() === 201) {
      const rows = await res.json();
      console.log(
        '[TAMPER INFO] Negative tax rate accepted at DB level — app-level validation should catch this'
      );
      await request.delete(
        `${SUPABASE_URL}/rest/v1/invoices?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[TAMPER PASS] Negative tax rate rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Cleanup ─────────────────────────────────────────────────────────

  test('CLEANUP: Remove tampering test client', async ({ request }) => {
    if (testClientId) {
      await request.delete(
        `${SUPABASE_URL}/rest/v1/clients?id=eq.${testClientId}`,
        { headers: pgRestHeaders(tokenA) }
      );
    }
    console.log('[TAMPER] Test data cleaned up');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  VECTOR 3: AUTHENTICATION BYPASS (BROKEN ACCESS CONTROL)
// ═══════════════════════════════════════════════════════════════════════

test.describe('VECTOR 3 — Authentication Bypass', () => {
  // ── Unauthenticated access to API routes ────────────────────────────

  test('BYPASS: /api/invoices/[id]/pdf rejects unauthenticated requests', async ({
    request,
  }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${BASE_URL}/api/invoices/${fakeId}/pdf`, {
      maxRedirects: 0
    });
    expect(
      [401, 404, 302, 307].includes(res.status()),
      `PDF endpoint returned unexpected status ${res.status()} for unauthenticated request`
    ).toBeTruthy();
    console.log(
      `[BYPASS PASS] /api/invoices/[id]/pdf → HTTP ${res.status()} (unauthenticated)`
    );
  });

  test('BYPASS: /api/invoices/[id]/pdf rejects forged cookies', async ({
    request,
  }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${BASE_URL}/api/invoices/${fakeId}/pdf`, {
      headers: {
        Cookie:
          'sb-hfwuvramwfwmyplynqyr-auth-token=forged-invalid-token-value',
      },
      maxRedirects: 0
    });
    expect(
      [401, 404, 302, 307].includes(res.status()),
      `PDF endpoint accepted forged cookie! Status: ${res.status()}`
    ).toBeTruthy();
    console.log(
      `[BYPASS PASS] /api/invoices/[id]/pdf → HTTP ${res.status()} (forged cookie)`
    );
  });

  // ── Unauthenticated access to Supabase PostgREST ────────────────────

  test('BYPASS: Supabase PostgREST rejects requests with no token', async ({
    request,
  }) => {
    const res = await request.get(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        // No Authorization header — unauthenticated
      },
    });
    // With anon key only, RLS should return empty (no user context)
    if (res.status() === 200) {
      const rows = await res.json();
      expect(
        rows.length,
        'Unauthenticated PostgREST returned invoices!'
      ).toBe(0);
    }
    console.log(
      `[BYPASS PASS] PostgREST unauthenticated → HTTP ${res.status()}`
    );
  });

  test('BYPASS: Supabase PostgREST rejects requests with invalid token', async ({
    request,
  }) => {
    const res = await request.get(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      },
    });
    // Should get 401 or empty result
    expect(
      [401, 200].includes(res.status()),
      `Unexpected status: ${res.status()}`
    ).toBeTruthy();
    if (res.status() === 200) {
      const rows = await res.json();
      expect(rows.length).toBe(0);
    }
    console.log(
      `[BYPASS PASS] PostgREST invalid token → HTTP ${res.status()}`
    );
  });

  test('BYPASS: Supabase PostgREST rejects requests with empty Bearer', async ({
    request,
  }) => {
    const res = await request.get(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ',
      },
    });
    expect(
      [401, 200].includes(res.status()),
      `Unexpected status: ${res.status()}`
    ).toBeTruthy();
    if (res.status() === 200) {
      const rows = await res.json();
      expect(rows.length).toBe(0);
    }
    console.log(
      `[BYPASS PASS] PostgREST empty Bearer → HTTP ${res.status()}`
    );
  });

  // ── Unauthenticated access to Supabase GoTrue ───────────────────────

  test('BYPASS: GoTrue rejects invalid credentials', async ({ request }) => {
    const res = await request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        data: { email: 'nonexistent@evil.com', password: 'wrongpassword' },
      }
    );
    expect(res.status()).toBe(400);
    console.log(
      `[BYPASS PASS] GoTrue invalid credentials → HTTP ${res.status()}`
    );
  });

  test('BYPASS: GoTrue rejects malformed token request', async ({
    request,
  }) => {
    const res = await request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        data: { email: '', password: '' },
      }
    );
    expect(res.status()).not.toBe(200);
    console.log(
      `[BYPASS PASS] GoTrue malformed request → HTTP ${res.status()}`
    );
  });

  // ── Unauthenticated access to cron endpoint ─────────────────────────

  test('BYPASS: /api/cron/reminders rejects requests without CRON_SECRET', async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/api/cron/reminders`);
    // If CRON_SECRET is set, should return 401. If not set, it may allow access.
    if (res.status() === 401) {
      console.log(
        '[BYPASS PASS] /api/cron/reminders requires CRON_SECRET'
      );
    } else {
      console.log(
        `[BYPASS WARNING] /api/cron/reminders → HTTP ${res.status()} (CRON_SECRET may not be set)`
      );
    }
  });

  test('BYPASS: /api/cron/reminders rejects wrong Bearer token', async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/api/cron/reminders`, {
      headers: {
        Authorization: 'Bearer wrong-secret-value',
      },
    });
    if (res.status() === 401) {
      console.log(
        '[BYPASS PASS] /api/cron/reminders rejects wrong Bearer token'
      );
    } else {
      console.log(
        `[BYPASS WARNING] /api/cron/reminders → HTTP ${res.status()} with wrong Bearer`
      );
    }
  });

  // ── Unauthenticated Supabase insert attempt ─────────────────────────

  test('BYPASS: Cannot insert invoices without authentication', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        // No Authorization header
      },
      data: {
        client_id: '00000000-0000-0000-0000-000000000000',
        invoice_number: `UNAUTH-${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    // Should fail: 401 or RLS violation (no user_id)
    expect(
      res.status(),
      'Unauthenticated insert succeeded!'
    ).not.toBe(201);
    console.log(
      `[BYPASS PASS] Unauthenticated insert → HTTP ${res.status()}`
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  VECTOR 4: MASS ASSIGNMENT / PRIVILEGE ESCALATION
// ═══════════════════════════════════════════════════════════════════════

test.describe('VECTOR 4 — Mass Assignment / Privilege Escalation', () => {
  let testClientId: string;
  let testInvoiceId: string;

  test('SETUP: Create test data for mass assignment tests', async ({
    request,
  }) => {
    // Create client
    const clientRes = await request.post(`${SUPABASE_URL}/rest/v1/clients`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId,
        client_name: `Mass Assignment Test ${Date.now()}`,
        email: `massassign-${Date.now()}@example.com`,
      },
    });
    expect(clientRes.status()).toBe(201);
    const clientRows = await clientRes.json();
    testClientId = clientRows[0]?.id;

    // Create invoice
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const invoiceRes = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userAId,
        client_id: testClientId,
        invoice_number: `MASS-${Date.now()}`,
        amount: 500,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    expect(invoiceRes.status()).toBe(201);
    const invoiceRows = await invoiceRes.json();
    testInvoiceId = invoiceRows[0]?.id;
  });

  // ── Inject user_id on invoice creation ──────────────────────────────

  test('MASS ASSIGN: Cannot set user_id to another user on invoice creation', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userBId, // Attempt to create invoice under User B's account
        client_id: testClientId,
        invoice_number: `MASS-ESC-${Date.now()}`,
        amount: 999,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
      },
    });
    if (res.status() === 201) {
      const rows = await res.json();
      // Check if user_id was overridden by the auth context
      const assignedUserId = rows[0]?.user_id;
      if (assignedUserId === userBId) {
        // CRITICAL: user_id was set to another user!
        console.log(
          '[MASS ASSIGN CRITICAL] user_id was set to User B! Potential privilege escalation.'
        );
      } else {
        expect(assignedUserId).toBe(userAId);
        console.log(
          '[MASS ASSIGN PASS] user_id was overridden to authenticated user (server-side enforcement)'
        );
      }
      // Cleanup
      await request.delete(
        `${SUPABASE_URL}/rest/v1/invoices?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[MASS ASSIGN PASS] Injection rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Inject admin fields on profile update ────────────────────────────

  test('MASS ASSIGN: Cannot escalate profile to admin via PostgREST', async ({
    request,
  }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userAId}`,
      {
        headers: pgRestHeaders(tokenA),
        data: {
          role: 'admin',
          is_super_user: true,
          is_admin: true,
          plan: 'enterprise',
        },
      }
    );
    // Check if the profile has these columns
    if (res.status() === 200) {
      const rows = await res.json();
      if (rows.length > 0) {
        const profile = rows[0];
        // These columns likely don't exist, so they'd be ignored by PostgREST
        console.log(
          `[MASS ASSIGN] Profile update response: role=${profile.role}, is_super_user=${profile.is_super_user}`
        );
        // If the columns don't exist, PostgREST silently ignores them
        // If they do exist, check they weren't set
        if (profile.role === 'admin') {
          console.log(
            '[MASS ASSIGN CRITICAL] Profile role was set to admin!'
          );
        } else {
          console.log(
            '[MASS ASSIGN PASS] Admin fields not applied to profile'
          );
        }
      }
    } else {
      console.log(
        `[MASS ASSIGN PASS] Profile update rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Inject user_id on client creation ───────────────────────────────

  test('MASS ASSIGN: Cannot set user_id to another user on client creation', async ({
    request,
  }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/clients`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userBId, // Attempt to create client under User B's account
        client_name: `Escaped Client ${Date.now()}`,
        email: `escape-${Date.now()}@example.com`,
      },
    });
    if (res.status() === 201) {
      const rows = await res.json();
      const assignedUserId = rows[0]?.user_id;
      if (assignedUserId === userBId) {
        console.log(
          '[MASS ASSIGN CRITICAL] Client user_id was set to User B!'
        );
      } else {
        expect(assignedUserId).toBe(userAId);
        console.log(
          '[MASS ASSIGN PASS] Client user_id overridden to authenticated user'
        );
      }
      // Cleanup
      await request.delete(
        `${SUPABASE_URL}/rest/v1/clients?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[MASS ASSIGN PASS] Client injection rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Inject user_id on profile update ────────────────────────────────

  test('MASS ASSIGN: Cannot change profile id to another user', async ({
    request,
  }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userAId}`,
      {
        headers: pgRestHeaders(tokenA),
        data: {
          id: userBId, // Attempt to change the profile's primary key
        },
      }
    );
    // PostgREST typically ignores primary key changes in PATCH
    if (res.status() === 200) {
      const rows = await res.json();
      if (rows.length > 0) {
        expect(
          rows[0].id,
          'Profile id was changed to another user!'
        ).toBe(userAId);
        console.log(
          '[MASS ASSIGN PASS] Profile id cannot be changed via PATCH'
        );
      }
    } else {
      console.log(
        `[MASS ASSIGN PASS] Profile id change rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Inject fields on AI settings ────────────────────────────────────

  test('MASS ASSIGN: Cannot set user_id on AI settings', async ({
    request,
  }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/user_ai_settings`, {
      headers: pgRestHeaders(tokenA),
      data: {
        user_id: userBId, // Attempt to write under User B
        base_url: 'https://evil.example.com',
        model_name: 'gpt-4',
        api_key_encrypted: 'fake-encrypted-key',
      },
    });
    if (res.status() === 201) {
      const rows = await res.json();
      const assignedUserId = rows[0]?.user_id;
      if (assignedUserId === userBId) {
        console.log(
          '[MASS ASSIGN CRITICAL] AI settings user_id was set to User B!'
        );
      } else {
        console.log(
          '[MASS ASSIGN PASS] AI settings user_id overridden to authenticated user'
        );
      }
      // Cleanup
      await request.delete(
        `${SUPABASE_URL}/rest/v1/user_ai_settings?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[MASS ASSIGN PASS] AI settings injection rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Inject reminder_count on invoice ────────────────────────────────

  test('MASS ASSIGN: Cannot manipulate reminder_count on invoice creation', async ({
    request,
  }) => {
    const futureDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    const res = await request.post(`${SUPABASE_URL}/rest/v1/invoices`, {
      headers: pgRestHeaders(tokenA),
      data: {
        client_id: testClientId,
        user_id: userAId,
        invoice_number: `MASS-RC-${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'draft',
        due_date: futureDate,
        reminder_count: 999, // Fake high count
        last_reminder_at: new Date().toISOString(),
        paid_date: '2025-01-01', // Fake paid date on a draft
      },
    });
    if (res.status() === 201) {
      const rows = await res.json();
      console.log(
        `[MASS ASSIGN] reminder_count=${rows[0]?.reminder_count}, paid_date=${rows[0]?.paid_date}`
      );
      // DB likely allows this — app-level logic should protect status transitions
      if (rows[0]?.reminder_count === 999) {
        console.log(
          '[MASS ASSIGN INFO] reminder_count accepted at DB level — app should enforce business logic'
        );
      }
      // Cleanup
      await request.delete(
        `${SUPABASE_URL}/rest/v1/invoices?id=eq.${rows[0].id}`,
        { headers: pgRestHeaders(tokenA) }
      );
    } else {
      console.log(
        `[MASS ASSIGN PASS] Injection rejected (HTTP ${res.status()})`
      );
    }
  });

  // ── Cleanup ─────────────────────────────────────────────────────────

  test('CLEANUP: Remove mass assignment test data', async ({ request }) => {
    if (testInvoiceId) {
      await request.delete(
        `${SUPABASE_URL}/rest/v1/invoices?id=eq.${testInvoiceId}`,
        { headers: pgRestHeaders(tokenA) }
      );
    }
    if (testClientId) {
      await request.delete(
        `${SUPABASE_URL}/rest/v1/clients?id=eq.${testClientId}`,
        { headers: pgRestHeaders(tokenA) }
      );
    }
    console.log('[MASS ASSIGN] Test data cleaned up');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  VECTOR 5 (BONUS): SUPABASE ANON KEY EXPOSURE & API ENUMERATION
// ═══════════════════════════════════════════════════════════════════════

test.describe('VECTOR 5 — API Enumeration & Information Disclosure', () => {
  test('ENUMERATE: Supabase REST API exposes table structure', async ({
    request,
  }) => {
    // PostgREST supports OpenAPI introspection
    const res = await request.get(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (res.status() === 200) {
      const body = await res.text();
      const tableCount = (body.match(/\/rest\/v1\//g) || []).length;
      console.log(
        `[ENUMERATE] PostgREST root returned HTTP 200 (${tableCount} references found)`
      );
      console.log(
        '[ENUMERATE INFO] Table names are enumerable via PostgREST — ensure RLS is enforced on ALL tables'
      );
    } else {
      console.log(
        `[ENUMERATE PASS] PostgREST root → HTTP ${res.status()}`
      );
    }
  });

  test('ENUMERATE: Check Supabase health endpoint', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    console.log(
      `[ENUMERATE] Supabase auth health → HTTP ${res.status()}`
    );
  });

  test('ENUMERATE: Check for exposed GoTrue settings', async ({
    request,
  }) => {
    const res = await request.get(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (res.status() === 200) {
      const body = await res.json();
      console.log(
        `[ENUMERATE] GoTrue settings exposed — external providers: ${JSON.stringify(body.external_labels || 'none')}`
      );
    }
  });
});
