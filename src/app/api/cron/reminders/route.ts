import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidAccessToken, sendGmailReminder } from '@/lib/notifications/gmail'

export async function GET(request: Request) {
  try {
    // 1. Verify authorization (optional but recommended for cron jobs)
    const authHeader = request.headers.get('authorization')
    
    // If CRON_SECRET is set, enforce it. If not set, we still enforce a check so it's not totally open.
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Server configuration missing CRON_SECRET' }, { status: 401 })
    }
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Initialize Supabase Admin Client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Determine current day and time block (Morning, Afternoon, Evening)
    const now = new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const currentDay = days[now.getDay()]
    const currentHour = now.getHours()
    
    let timeBlock = 'Morning'
    if (currentHour >= 12 && currentHour < 17) timeBlock = 'Afternoon'
    else if (currentHour >= 17) timeBlock = 'Evening'

    // For testing/manual trigger, we can pass ?force=true
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    // 4. Query users who have reminders enabled and match the schedule
    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, reminder_day, reminder_time')
      .eq('reminder_enabled', true)

    if (!force) {
      query = query.eq('reminder_day', currentDay).eq('reminder_time', timeBlock)
    }

    const { data: users, error: usersError } = await query

    if (usersError) throw usersError
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users scheduled for reminders right now.' })
    }

    // 5. For each scheduled user, check if they have active outstanding invoices
    const notificationsSent = []

    for (const user of users) {
      const { data: outstandingInvoices, error: invoicesError } = await supabaseAdmin
        .from('invoices')
        .select('id, invoice_number, amount, currency, status')
        .eq('user_id', user.id)
        .in('status', ['sent', 'due_soon', 'overdue'])

      if (!invoicesError && outstandingInvoices && outstandingInvoices.length > 0) {
        let sentMethod = 'console_logged'
        try {
          // Check if user has an active Gmail connection
          const { data: connection } = await supabaseAdmin
            .from('email_connections')
            .select('id')
            .eq('user_id', user.id)
            .eq('provider', 'gmail')
            .single()

          if (connection) {
            const accessToken = await getValidAccessToken(supabaseAdmin, user.id)
            const subject = `📊 ChaseFree AI: Weekly Outstanding Invoices Summary`
            const bodyHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #10b981; margin-top: 0;">Hello ${user.full_name || 'User'},</h2>
                <p style="color: #334155; font-size: 16px;">You have <strong>${outstandingInvoices.length} outstanding invoices</strong> requiring attention:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px;">
                  <thead>
                    <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                      <th style="padding: 8px; font-weight: 600; color: #475569;">Invoice #</th>
                      <th style="padding: 8px; font-weight: 600; color: #475569;">Amount</th>
                      <th style="padding: 8px; font-weight: 600; color: #475569;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${outstandingInvoices.map(inv => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 8px; color: #0f172a;">#${inv.invoice_number}</td>
                        <td style="padding: 8px; color: #0f172a; font-weight: 500;">${inv.currency} ${Number(inv.amount).toFixed(2)}</td>
                        <td style="padding: 8px;"><span style="background-color: ${inv.status === 'overdue' ? '#fee2e2; color: #ef4444;' : '#fef3c7; color: #d97706;'} font-size: 11px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 600;">${inv.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Dashboard</a>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
                <p style="color: #94a3b8; font-size: 11px;">Sent automatically by ChaseFree AI reminders service.</p>
              </div>
            `
            await sendGmailReminder(accessToken, user.email, subject, bodyHtml)
            sentMethod = 'gmail_sent'
          } else {
            console.log(`[CRON] 📧 Gmail connection missing for ${user.email}. Simulation mode:`)
            console.log(`[CRON] Outstanding count: ${outstandingInvoices.length}`)
          }
        } catch (mailErr) {
          console.error(`[CRON] Failed to send email via Gmail for ${user.email}:`, mailErr)
          sentMethod = 'failed'
        }

        notificationsSent.push({
          userId: user.id,
          email: user.email,
          invoiceCount: outstandingInvoices.length,
          sentMethod
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      scannedUsers: users.length, 
      notificationsSent,
      schedule: { day: currentDay, timeBlock }
    })

  } catch (error) {
    console.error('[CRON ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

