import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { receiverId, message } = await request.json()

    // Get receiver's push subscription
    const { data: receiver, error } = await supabase
      .from('profiles')
      .select('push_subscription, name')
      .eq('id', receiverId)
      .single()

    if (error || !receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Send push notification if subscription exists
    if (receiver.push_subscription) {
      const payload = JSON.stringify({
        title: 'Water Reminder 💕',
        body: message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'water-reminder',
        data: { url: '/' },
      })

      await webpush.sendNotification(receiver.push_subscription, payload)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
