const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function resetOnboarding() {
  console.log('Signing in with test user...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testabhi1@clockivo.com',
    password: '***REMOVED***'
  });

  if (authError) {
    console.error('Authentication failed:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`Signed in successfully. User ID: ${userId}`);

  console.log('Resetting onboarding_completed to false...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: false })
    .eq('id', userId);

  if (updateError) {
    console.error('Profile update failed:', updateError.message);
    process.exit(1);
  }

  console.log('Onboarding status successfully reset to false.');
}

resetOnboarding();
