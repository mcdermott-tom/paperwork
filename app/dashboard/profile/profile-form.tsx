'use client'

import { useState } from 'react'
import { updateProfile } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// Define the required user data type
type UserProfile = {
  name: string | null;
  pro: string | null;
  ipiNumber: string | null;
};

export default function ProfileForm({ initialData }: { initialData: UserProfile | null }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    
    try {
      const result = await updateProfile(formData)

      if (result.success) {
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile: ' + result.error)
      }
    } catch (e) {
      alert('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artist Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="name">Legal Name / Artist Name</Label>
            <Input 
              name="name" 
              id="name" 
              placeholder="e.g. Miles Commodore" 
              defaultValue={initialData?.name ?? ''} // Pre-populate data
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pro">Performance Rights Org (PRO)</Label>
            <Input 
              name="pro" 
              id="pro" 
              placeholder="e.g. ASCAP, BMI, PRS" 
              defaultValue={initialData?.pro ?? ''} // Pre-populate data
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipiNumber">IPI / CAE Number</Label>
            <Input 
              name="ipiNumber" 
              id="ipiNumber" 
              placeholder="e.g. 123456789" 
              defaultValue={initialData?.ipiNumber ?? ''} // Pre-populate data
            />
            <p className="text-xs text-gray-500">This is the 9-digit number assigned to you by your PRO.</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}