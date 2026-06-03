import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase.from('invoices').select('id').order('created_at', { ascending: false }).limit(1)
  console.log('Most recent invoice:', data, error)
}
test()
