'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

interface WaterReminder {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  sent_at: string
  acknowledged: boolean
  acknowledged_at?: string
  sender?: {
    name: string
    email: string
  }
  receiver?: {
    name: string
    email: string
  }
}

interface RealtimeContextType {
  reminders: WaterReminder[]
  sendWaterReminder: (partnerId: string, message?: string) => Promise<void>
  acknowledgeReminder: (reminderId: string) => Promise<void>
  loading: boolean
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<WaterReminder[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setReminders([])
      setLoading(false)
      return
    }

    // Fetch initial reminders
    fetchReminders()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('water_reminders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'water_reminders',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime payload:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newReminder = payload.new as WaterReminder
            
            // Show toast notification
            toast.info("💕 Water Reminder!",{
                description: newReminder.message,
                duration: 5000,
              })

            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification('Water Reminder 💕', {
                body: newReminder.message,
                icon: '/icon-192x192.png',
                tag: 'water-reminder',
              })
            }

            // Add to reminders list
            setReminders(prev => [newReminder, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updatedReminder = payload.new as WaterReminder
            setReminders(prev => 
              prev.map(reminder => 
                reminder.id === updatedReminder.id ? updatedReminder : reminder
              )
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchReminders = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('water_reminders')
        .select(`
          *,
          sender:profiles!water_reminders_sender_id_fkey(name, email),
          receiver:profiles!water_reminders_receiver_id_fkey(name, email)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('sent_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendWaterReminder = async (partnerId: string, message?: string) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('water_reminders')
      .insert({
        sender_id: user.id,
        receiver_id: partnerId,
        message: message || `${profile?.name || 'Your partner'} reminds you to drink water! 💕`,
      })

    if (error) throw error

    // Send push notification
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: partnerId,
          message: message || `${profile?.name || 'Your partner'} reminds you to drink water! 💕`,
        }),
      })
    } catch (error) {
      console.error('Failed to send push notification:', error)
    }

    toast("Reminder Sent! 💕", {
      description: "Your partner will be reminded to drink water",
      duration: 3000,
    })
  }

  const acknowledgeReminder = async (reminderId: string) => {
    const { error } = await supabase
      .from('water_reminders')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', reminderId)

    if (error) throw error
  }

  return (
    <RealtimeContext.Provider
      value={{
        reminders,
        sendWaterReminder,
        acknowledgeReminder,
        loading,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
