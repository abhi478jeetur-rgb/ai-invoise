require('dotenv').config({ path: '.env.local' });
const myFetch = globalThis.fetch;

async function checkApi() {
  console.log('Checking environment variables...');
  
  // 1. Check Supabase
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supaUrl && supaKey) {
    try {
      const res = await myFetch(`${supaUrl}/rest/v1/?limit=1`, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      });
      console.log('Supabase API:', res.ok ? 'OK' : `FAIL (${res.status})`);
    } catch (e) {
      console.log('Supabase API: ERROR', e.message);
    }
  } else {
    console.log('Supabase API: MISSING VARS');
  }

  // 2. Check AI API
  const aiUrl = process.env.AI_BASE_URL;
  const aiKey = process.env.AI_API_KEY;
  const aiModel = process.env.AI_MODEL_NAME;
  if (aiUrl && aiKey && aiModel) {
    const endpoint = aiUrl.endsWith('/') ? aiUrl + 'chat/completions' : aiUrl + '/chat/completions';
    try {
      const res = await myFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey}` },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10
        })
      });
      console.log('AI API:', res.ok ? 'OK' : `FAIL (${res.status})`);
    } catch (e) {
      console.log('AI API: ERROR', e.message);
    }
  } else {
    console.log('AI API: MISSING VARS');
  }
}

checkApi();
