'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to pad strings (Space padding)
const pad = (str: string | null, length: number) => {
  const safeStr = (str || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ''); 
  return safeStr.padEnd(length, ' ').slice(0, length);
};

// Helper to pad numbers (Zero padding)
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

  const song = await db.song.findUnique({
    where: { id: songId },
    include: { writers: { include: { user: true } } }
  });

  if (!song) return { error: 'Song not found' };

  const lines = [];
  const transactionSeq = '00000001'; 

  // HDR
  lines.push(`HDRPB000000000PAPERWORK SYSTEM                       ${new Date().toISOString().slice(0,10).replace(/-/g,'')}00.00`);

  // GRH
  lines.push(`GRHNWR0000102.100000000000`);

  // NWR
  const title = pad(song.title, 60);
  const iswc = pad(song.iswc, 11);
  const submitterWorkId = pad(song.id, 14);
  lines.push(`NWR${transactionSeq}00000000${title}EN${submitterWorkId}${iswc}00000000`);

  // SWR (Writer) - Loop through writers
  let recordSeq = 1; 
  for (const w of song.writers) {
      // 1. IPI: 9 digits, zero-padded
      const rawIpi = w.user?.ipiNumber ? w.user.ipiNumber.replace(/-/g, '') : '000000000';
      const ipi = padNum(Number(rawIpi), 9); 
      
      // 2. Names
      const lastName = pad(w.user?.name || 'Unknown', 45); 
      const firstName = pad('', 30); 
      
      // 3. Spacing Logic (CRITICAL for alignment)
      // Filler: Unknown(1) + Desig(1) + TaxID(9) + Hire(1) = 12 spaces
      const filler = ' '.repeat(12);
      const roleCode = 'CA'; // Exactly 2 chars
      
      // 4. Shares (PR, MR, SR)
      // Format: Share (5) + Society (3). Repeated 3 times.
      // We use '000' for society (Generic/Unknown) and put the percentage in all 3 pots.
      const share = padNum(Number(w.percentage) * 100, 5); // e.g. "10000"
      const shares = `${share}000${share}000${share}000`; // Share+Soc x3

      // 5. IPI Name Number (11 chars) - Optional/Empty for now
      const trailingIpi = ' '.repeat(11);

      lines.push(`SWR${transactionSeq}${padNum(recordSeq, 8)}${ipi}${lastName}${firstName}${filler}${roleCode}${shares}${trailingIpi}`);
      recordSeq++;
  }

  // TRL
  // Col 9-16: Transaction Count (1 Song)
  // Col 17-24: Record Count (NWR + SWRs)
  const totalRecords = 1 + song.writers.length;
  lines.push(`TRL0000100000001${padNum(totalRecords, 8)}`);

  return { 
    filename: `${song.title.replace(/\s/g, '_')}.V21`,
    content: lines.join('\r\n') 
  };
}