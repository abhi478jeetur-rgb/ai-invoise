import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  if (userError || !users.users.length) {
    console.log('No users found', userError)
    return
  }
  const user = users.users[0]
  
  // create client
  const { data: client } = await supabase.from('clients').insert({
    user_id: user.id,
    client_name: 'Test Client',
    email: 'test@example.com'
  }).select().single()
  
  if (!client) {
    console.log('Could not create client')
    return
  }

  // create invoice
  const { data: invoice, error: invError } = await supabase.from('invoices').insert({
    user_id: user.id,
    client_id: client.id,
    invoice_number: 'TEST-123',
    amount: 100,
    due_date: new Date().toISOString()
  }).select().single()
  
  if (invError || !invoice) {
    console.log('Error creating invoice:', invError)
    return
  }
  
  console.log('Created invoice:', invoice.id)
  
  // test fetch like getInvoiceDetailAction
  const { data: fetched, error: fetchError } = await supabase
    .from('invoices')
    .select('*, clients (id, client_name, email, company_name, address, phone)')
    .eq('id', invoice.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
    
  console.log('Fetched invoice:', fetched?.id, 'Error:', fetchError)
}

test()
