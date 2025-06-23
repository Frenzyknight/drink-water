'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/contexts/RealtimeContext'
import { createClient } from '@/lib/supabase/client'
import { Heart, Droplets, LogOut, Bell, BellOff, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Partner {
  id: string
  name: string
  email: string
}

export default function Dashboard() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const { user, profile, signOut } = useAuth()
  const { reminders, sendWaterReminder, acknowledgeReminder, loading } = useRealtime()
  const supabase = createClient()

  useEffect(() => {
    if (profile?.partner_id) {
      fetchPartner()
    }
    checkNotificationPermission()
  }, [profile])

  const fetchPartner = async () => {
    if (!profile?.partner_id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', profile.partner_id)
        .single()

      if (error) throw error
      setPartner(data)
    } catch (error) {
      console.error('Failed to fetch partner:', error)
    }
  }

  const checkNotificationPermission = () => {
    setNotificationsEnabled(Notification.permission === 'granted')
  }

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          })

          // Save subscription to Supabase
          await supabase
            .from('profiles')
            .update({ push_subscription: subscription.toJSON() })
            .eq('id', user?.id)

          toast( "Notifications Enabled! 🔔",{
            description: "You'll now receive water reminders from your partner",
          })
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      toast.error( "Failed to Enable Notifications",{
        description: "Something went wrong. Please try again.",
      })
    }
  }

  const handleSendReminder = async () => {
    if (!partner) return

    try {
      await sendWaterReminder(partner.id)
    } catch (error: any) {
      toast.error( "Failed to Send Reminder",{
        description: error.message,
      })
    }
  }

  const handleAcknowledge = async (reminderId: string) => {
    try {
      await acknowledgeReminder(reminderId)
      toast("Thanks! 💕",{
        description: "Reminder acknowledged",
      })
    } catch (error: any) {
      toast.error("Failed to Acknowledge",{
        description: error.message,
      })
    }
  }

  const unacknowledgedReminders = reminders.filter(
    r => r.receiver_id === user?.id && !r.acknowledged
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-rose-500" />
              <Droplets className="h-6 w-6 text-blue-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Water Reminder 💕</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {unacknowledgedReminders.length > 0 && (
              <div className="bg-rose-500 text-white px-2 py-1 rounded-full text-xs">
                {unacknowledgedReminders.length} new
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="text-gray-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{profile?.name}</p>
                  <p className="text-sm text-gray-600">{profile?.email}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Notifications</span>
                  <Button
                    variant={notificationsEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={enableNotifications}
                    disabled={notificationsEnabled}
                  >
                    {notificationsEnabled ? (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <span>Your Partner</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partner ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{partner.name}</p>
                      <p className="text-sm text-gray-600">{partner.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No partner connected</p>
              )}
            </CardContent>
          </Card>

          {/* Water Reminder Card */}
          <Card className="md:col-span-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                <Droplets className="h-8 w-8 text-blue-500" />
                <span>Send Water Reminder</span>
              </CardTitle>
              <CardDescription>
                Remind your partner to stay hydrated with love 💕
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleSendReminder}
                disabled={!partner}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-rose-500 hover:from-blue-600 hover:to-rose-600 text-white px-12 py-6 text-lg"
              >
                <Heart className="h-6 w-6 mr-3" />
                Remind {partner?.name || 'Partner'} to Drink Water
                <Droplets className="h-6 w-6 ml-3" />
              </Button>
              
              {!partner && (
                <p className="mt-4 text-sm text-gray-600">
                  Connect with your partner to send reminders
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Reminders */}
          {reminders.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reminders.slice(0, 10).map((reminder) => (
                    <div 
                      key={reminder.id} 
                      className={`p-3 rounded-lg border ${
                        reminder.receiver_id === user?.id && !reminder.acknowledged
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{reminder.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(reminder.sent_at).toLocaleString()}
                          </p>
                        </div>
                        {reminder.receiver_id === user?.id && !reminder.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(reminder.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Thanks!
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
