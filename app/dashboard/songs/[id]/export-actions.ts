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
  lines.push(`HDRPB000000000PAPERWORK SYSTEM                       ${new Date().toISOString().slice(0,10).replace(/-/g,'')}00.00`);

  // GRH (Group Header)
  lines.push(`GRHAGR0000102.100000000000`);

  // NWR (New Work Registration)
  const title = pad(song.title, 60);
  const iswc = pad(song.iswc, 11);
  lines.push(`NWR${title}EN${pad(song.id, 14)}${iswc}00000000`);

  // SWR (Writer) - Loop through writers
  for (const w of song.writers) {
      const ipi = pad(w.user?.ipiNumber || '000000000', 9);
      const lastName = pad(w.user?.name || 'Unknown', 45); 
      // Note: CWR share is 000.00 format (multiplied by 100, so 50% = 05000)
      lines.push(`SWR${ipi}${lastName}${' '.repeat(30)}             ${padNum(Number(w.percentage) * 100, 5)}000`);
  }

  // TRL (Trailer)
  lines.push(`TRL00001${padNum(song.writers.length + 2, 8)}00000000`);

  return { 
    filename: `${song.title.replace(/\s/g, '_')}.V21`,
    content: lines.join('\r\n') 
  };
}