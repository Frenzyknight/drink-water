import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { Toaster } from '@/components/ui/sonner'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Water Reminder for Couples 💕',
  description: 'Send loving water reminders to your partner',
  manifest: '/manifest.json',
  themeColor: '#f43f5e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
        <AuthProvider>
          <RealtimeProvider>
            {children}
            <Toaster />
          </RealtimeProvider>
        </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
