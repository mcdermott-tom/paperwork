'use client'

import { useState } from 'react'
import { updateProfile } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input' // run: npx shadcn@latest add input label
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button' // run: npx shadcn@latest add button

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    
    try {
      await updateProfile(formData)
      alert('Profile updated successfully!')
    } catch (e) {
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Artist Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Legal Name / Artist Name</Label>
              <Input name="name" id="name" placeholder="e.g. Miles Commodore" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pro">Performance Rights Org (PRO)</Label>
              <Input name="pro" id="pro" placeholder="e.g. ASCAP, BMI, PRS" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipiNumber">IPI / CAE Number</Label>
              <Input name="ipiNumber" id="ipiNumber" placeholder="e.g. 123456789" />
              <p className="text-xs text-gray-500">This is the 9-digit number assigned to you by your PRO.</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}