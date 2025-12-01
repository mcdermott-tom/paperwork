'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Reuse your sanitizers
const sanitizeISRC = (isrc: string | null | undefined) => {
    if (!isrc) return null;
    return isrc.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

// Define the shape of the incoming data (Generic Music CSV columns)
type CsvRow = {
  title: string;
  isrc: string;
  artist?: string; // Optional, for context
}

export async function ingestCsvBatch(rows: CsvRow[]) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let createdCount = 0;
  let errors = 0;

  // Loop through rows and insert
  for (const row of rows) {
    if (!row.title) continue; // Skip empty rows

    const cleanISRC = sanitizeISRC(row.isrc);

    try {
      // 1. Create/Find the Song (Parent)
      // Strategy: Upsert based on Title + User (Simplistic matching for MVP)
      // Note: Ideally we match on ISWC, but CSVs usually lack ISWC.
      // We will create a new song if one with this exact title doesn't exist for this user.
      
      // Since Prisma upsert requires a unique constraint, we'll do a findFirst -> create flow here
      // to avoid complex unique constraints on (title, userId) for now.
      
      let song = await db.song.findFirst({
        where: { 
          title: row.title,
          writers: { some: { userId: user.id } }
        }
      });

      if (!song) {
        song = await db.song.create({
          data: {
            title: row.title,
            writers: {
              create: { userId: user.id, percentage: 100, role: 'Composer' }
            }
          }
        });
      }

      // 2. Create/Update the Release (Master)
      // We match strictly on ISRC if provided, otherwise we assume it's a new release.
      if (cleanISRC) {
        await db.release.upsert({
          where: { isrc: cleanISRC },
          update: { title: row.title }, // Update title if changed
          create: {
            songId: song.id,
            title: row.title,
            isrc: cleanISRC
          }
        });
      } else {
        // If no ISRC, just create a release (warning: potential duplicates if run twice)
        await db.release.create({
          data: { songId: song.id, title: row.title }
        });
      }

      createdCount++;
    } catch (e) {
      console.error("Ingest Error for row:", row, e);
      errors++;
    }
  }

  revalidatePath('/dashboard/songs');
  revalidatePath('/dashboard/releases');
  
  return { success: true, count: createdCount, errors };
}