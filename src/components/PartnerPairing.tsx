'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Heart, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const pairingSchema = z.object({
  partnerEmail: z.string().email('Invalid email address'),
})

export default function PartnerPairing() {
  const [loading, setLoading] = useState(false)
  const { profile, updateProfile } = useAuth()
  const supabase = createClient()

  const form = useForm({
    resolver: zodResolver(pairingSchema),
    defaultValues: {
      partnerEmail: '',
    },
  })

  const onSubmit = async (values: { partnerEmail: string }) => {
    setLoading(true)
    try {
      // Find partner by email
      const { data: partner, error: findError } = await supabase
        .from('profiles')
        .select('id, name, email, partner_id')
        .eq('email', values.partnerEmail.toLowerCase())
        .single()

      if (findError || !partner) {
        throw new Error('Partner not found. Make sure they have created an account.')
      }

      if (partner.id === profile?.id) {
        throw new Error('You cannot pair with yourself')
      }

      if (partner.partner_id) {
        throw new Error('This person is already paired with someone else')
      }

      // Update both profiles to pair them
      const { error: updateError1 } = await supabase
        .from('profiles')
        .update({ partner_id: partner.id })
        .eq('id', profile?.id)

      if (updateError1) throw updateError1

      const { error: updateError2 } = await supabase
        .from('profiles')
        .update({ partner_id: profile?.id })
        .eq('id', partner.id)

      if (updateError2) throw updateError2

      await updateProfile({ partner_id: partner.id })

      toast("Successfully Paired! 💕",{
        description: `You're now connected with ${partner.name}`,
      })
    } catch (error: any) {
      toast.error("Pairing Failed",{
        description: error.message
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500" />
            <UserPlus className="h-8 w-8 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Find Your Partner
          </CardTitle>
          <CardDescription>
            Enter your partner's email to connect and start caring for each other 💕
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="partnerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner's Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your partner's email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-rose-500 hover:bg-rose-600"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect with Partner 💕'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Make sure your partner has already created an account 
              with the email address you're entering.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
