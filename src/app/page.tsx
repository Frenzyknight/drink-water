'use client'

import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import PartnerPairing from '@/components/PartnerPairing'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
