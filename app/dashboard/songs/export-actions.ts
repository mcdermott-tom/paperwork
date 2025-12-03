'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to pad strings for CWR (Strict fixed-width format)
const pad = (str: string | null, length: number) => {
  const safeStr = (str || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ''); // alphanumeric only
  return safeStr.padEnd(length, ' ').slice(0, length);
};

// Helper to pad numbers (zeros on left)
const padNum = (num: number | null, length: number) => {
  const safeNum = (num || 0).toString();
  return safeNum.padStart(length, '0').slice(0, length);
};

export async function generateCWR(songId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Fetch Full Song Data
  const song = await db.song.findUnique({
    where: { id: songId },
    include: { writers: { include: { user: true } } }
  });

  if (!song) return { error: 'Song not found' };

  // 2. Build CWR Rows (Simplified V2.1)
  const lines = [];

  // HDR (Header)
  // Record Type (3), Sender Type (2), Sender ID (9), Sender Name (45), Creation Date (8), ...
  lines.push(`HDRPB000000000PAPERWORK SYSTEM                       ${new Date().toISOString().slice(0,10).replace(/-/g,'')}00.00`);

  // GRH (Group Header)
  lines.push(`GRHAGR0000102.100000000000`);

  // NWR (New Work Registration)
  // Record Type (3), Work Title (60), Language (2), Work ID (14), ISWC (11), ...
  const title = pad(song.title, 60);
  const iswc = pad(song.iswc, 11);
  lines.push(`NWR${title}EN${pad(song.id, 14)}${iswc}00000000`);

  // SPU (Publisher - Placeholder if self-published)
  // For independent artists, they are their own publisher.
  // lines.push(...) 

  // SPT (Publisher Territory)
  // lines.push(...)

  // OPU (Original Publisher) - usually linked to the writer
  
  // SWR (Writer) - Loop through writers
  for (const w of song.writers) {
      // Record Type (3), Interested Party # (9), Last Name (45), First Name (30), ...
      // Note: We need real IPI numbers for this to work perfectly.
      const ipi = pad(w.user?.ipiNumber || '000000000', 9);
      const lastName = pad(w.user?.name || 'Unknown', 45); 
      lines.push(`SWR${ipi}${lastName}${' '.repeat(30)}             ${padNum(Number(w.percentage) * 100, 5)}000`);
  }

  // TRL (Trailer)
  // Record Type (3), Group Count (5), Transaction Count (8), Record Count (8)
  lines.push(`TRL00001${padNum(song.writers.length + 2, 8)}00000000`);

  // 3. Return the file content
  return { 
    filename: `${song.title.replace(/\s/g, '_')}.V21`,
    content: lines.join('\r\n') 
  };
}