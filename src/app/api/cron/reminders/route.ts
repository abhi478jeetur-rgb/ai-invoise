import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // 5. For each scheduled user, check if they have unbilled tasks
    const notificationsSent = []

    for (const user of users) {
      const { data: unbilled, error: unbilledError } = await supabaseAdmin
        .from('unbilled_tasks')
        .select('id, description')
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (!unbilledError && unbilled && unbilled.length > 0) {
        // Here we would integrate with Resend, SendGrid, or AWS SES
        // For now, we simulate the email logic by logging to console
        console.log(`[CRON] 📧 Sending Reminder Email to ${user.email} (${user.full_name})`)
        console.log(`[CRON] You have ${unbilled.length} pending unbilled tasks:`)
        unbilled.forEach(task => console.log(`   - ${task.description}`))
        console.log(`[CRON] Click here to generate invoices: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n`)

        notificationsSent.push({
          userId: user.id,
          email: user.email,
          taskCount: unbilled.length
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
