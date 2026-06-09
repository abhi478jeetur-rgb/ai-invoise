require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = globalThis.fetch;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: { fetch },
  }
);

async function testAuth() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'testabhi5@clockivo.com',
    password: 'U+o6;;EH'
  });
  console.log('testabhi5 auth result:', error ? 'FAIL: ' + error.message : 'SUCCESS: ' + data.user.id);
  
  const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
    email: 'testabhi1@clockivo.com',
    password: 'U+o6;;EH'
  });
  console.log('testabhi1 auth result:', e2 ? 'FAIL: ' + e2.message : 'SUCCESS: ' + d2.user.id);
}
testAuth();
