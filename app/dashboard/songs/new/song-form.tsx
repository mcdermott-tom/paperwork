'use client'

import { createSong } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

// --- New Validation Dependencies ---
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'

// Define the ISWC format validation schema
const SongSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  
  // FIX: Use z.union to correctly handle the initial empty state ('') and optional types (undefined).
  iswc: z.union([z.literal(''), z.string()])
    .optional()
    .transform(val => {
      // 1. CLEAN TO DATABASE FORMAT (T + 10 digits)
      if (!val) return undefined; 
      
      let cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
          cleaned = 'T' + cleaned;
      }
      
      // If the result is not the correct 11-character length, validation must fail.
      if (cleaned.length !== 11) return cleaned; 

      // 2. TRANSFORM TO DISPLAY FORMAT (T-DDD.DDD.DDD-D) as requested by user
      return `${cleaned[0]}-${cleaned.slice(1, 4)}.${cleaned.slice(4, 7)}.${cleaned.slice(7, 10)}-${cleaned[10]}`;
    })
    // Ensure that the value passed to the Server Action is clean (or null if blank)
    .pipe(
      z.string().optional().refine(val => {
        if (!val) return true; 
        
        // 3. VALIDATE: Check the final 15-character display format
        return /^T-\d{3}\.\d{3}\.\d{3}-\d{1}$/.test(val) && val.length === 15;
      }, {
        message: "Invalid ISWC. Must resolve to the fully standardized T-DDD.DDD.DDD-D format.",
      })
    ),
})

export function SongForm() {
  const [loading, setLoading] = useState(false)
  
  const form = useForm<z.infer<typeof SongSchema>>({
    resolver: zodResolver(SongSchema),
    defaultValues: {
      title: "",
      iswc: undefined, 
    },
  })

  async function onSubmit(values: z.infer<typeof SongSchema>) {
    setLoading(true)
    
    // Create FormData for the Server Action
    const formData = new FormData()
    formData.append('title', values.title)
    
    // Convert the formatted ISWC back to the clean DB format (T11-digits) for saving
    const iswcForDb = values.iswc ? values.iswc.replace(/[^A-Z0-9]/g, '') : '';
    formData.append('iswc', iswcForDb); 

    const result = await createSong(formData)
    setLoading(false)
    
    if (result?.error) {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Song Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Yesterday" {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="iswc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ISWC (Optional)</FormLabel>
              <FormControl>
                {/* Ensure field.value is converted to string for the input field */}
                <Input 
                  placeholder="e.g. T-034.502.997-1" 
                  {...field} 
                  value={field.value || ''} // Handle undefined gracefully
                />
              </FormControl>
              <FormMessage /> 
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Song'}
        </Button>
      </form>
    </Form>
  )
}