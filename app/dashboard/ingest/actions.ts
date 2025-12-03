'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Helper: Sanitize strings
const clean = (str: any) => {
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.length > 0 ? cleaned : null;
};

export async function ingestCsvBatch(rows: any[]) {
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

  for (const row of rows) {
    // 1. UNIVERSAL MAPPING: Check for common headers from DistroKid, ASCAP, BMI, Tunecore
    const title = row['Title'] || row['Track Title'] || row['Work Title'] || row['Song Name'];
    
    // ASCAP/BMI usually provide ISWC (Composition ID)
    const rawIswc = row['ISWC'] || row['ISWC Code'];
    
    // Distributors usually provide ISRC (Recording ID)
    const rawIsrc = row['ISRC'] || row['isrc'];

    if (!title) continue; 

    const iswcClean = clean(rawIswc);
    const isrcClean = clean(rawIsrc);

    try {
      // 2. FIND OR CREATE SONG (Composition)
      // Match by ISWC first (strongest), then by Title + User (fuzzy)
      let song = null;

      if (iswcClean) {
        song = await db.song.findUnique({ where: { iswc: iswcClean } });
      }

      if (!song) {
        song = await db.song.findFirst({
          where: { 
            title: title,
            writers: { some: { userId: user.id } }
          }
        });
      }

      if (!song) {
        song = await db.song.create({
          data: {
            title,
            iswc: iswcClean,
            writers: {
              create: { userId: user.id, percentage: 100, role: 'Composer' }
            }
          }
        });
      } else if (iswcClean && !song.iswc) {
        // Update existing song with missing ISWC
        await db.song.update({ where: { id: song.id }, data: { iswc: iswcClean } });
      }

      // 3. CREATE RELEASE (If ISRC exists - usually from DistroKid/Spotify CSVs)
      if (isrcClean) {
        await db.release.upsert({
          where: { isrc: isrcClean },
          update: { title },
          create: {
            songId: song.id,
            title,
            isrc: isrcClean
          }
        });
      }

      createdCount++;
    } catch (e) {
      console.error("Ingest Error:", e);
      errors++;
    }
  }

  revalidatePath('/dashboard/songs');
  revalidatePath('/dashboard/releases');
  
  return { success: true, count: createdCount, errors };
}