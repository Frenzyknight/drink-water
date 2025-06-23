// Update app/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import AuthForm from '@/components/AuthForm'
import PartnerPairing from '@/components/PartnerPairing'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeoutReached(true)
    }, 10000) // 10 seconds timeout

    return () => clearTimeout(timeout)
  }, [])

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (timeoutReached && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Loading timeout</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  if (!profile?.partner_id) {
    return <PartnerPairing />
  }

  return <Dashboard />
}
