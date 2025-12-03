'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Base URLs
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'; 
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'; 

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

// 1. Helper: Get Client Credentials Token
async function getSpotifyToken() {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  });

  const data = await response.json();
  if (data.error) throw new Error(`Spotify Token Error: ${data.error_description}`);
  return data.access_token;
}

// 2. Action: Search for an Artist
export async function searchSpotifyArtists(query: string) {
  if (!query) return [];
  
  try {
    const token = await getSpotifyToken();
    const response = await fetch(
      `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!response.ok) return [];

    const data = await response.json();
    return data.artists.items.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || null,
      genres: artist.genres.slice(0, 3).join(', ')
    }));
  } catch (e) {
    console.error("Spotify Search Error:", e);
    return [];
  }
}

// 3. Action: Claim Artist
export async function claimArtist(artistId: string, avatarUrl: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        spotifyArtistId: artistId,
        avatarUrl: avatarUrl
      }
    })
    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to link artist profile.' }
  }
}

// 4. Action: Sync Full Catalog (SMARTER RE-LINKING)
export async function importSpotifyCatalog() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { spotifyArtistId: true }
    });

    if (!dbUser?.spotifyArtistId) {
      return { error: 'No Spotify Artist connected.' };
    }

    const token = await getSpotifyToken();
    const artistId = dbUser.spotifyArtistId;

    // 1. Update Profile Image
    const artistResp = await fetch(
        `${SPOTIFY_API_URL}/artists/${artistId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const artistData = await artistResp.json();
    if (artistData.images && artistData.images.length > 0) {
        await db.user.update({
            where: { id: user.id },
            data: { avatarUrl: artistData.images[0].url }
        });
    }

    // 2. Fetch Catalog
    const albumsResp = await fetch(
      `${SPOTIFY_API_URL}/artists/${artistId}/albums?include_groups=album,single&limit=50`, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const albumsData = await albumsResp.json();
    const albums = albumsData.items || [];

    let allTrackIds: string[] = [];
    
    for (const album of albums) {
        const tracksResp = await fetch(
            `${SPOTIFY_API_URL}/albums/${album.id}/tracks?limit=50`, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const tracksData = await tracksResp.json();
        const ids = tracksData.items.map((t: any) => t.id);
        allTrackIds.push(...ids);
    }

    // 3. Process Tracks (Batch)
    const trackBatches = chunkArray(allTrackIds, 50);
    let importCount = 0;

    for (const batch of trackBatches) {
        const idsParam = batch.join(',');
        const fullTracksResp = await fetch(
            `${SPOTIFY_API_URL}/tracks?ids=${idsParam}`, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const fullTracksData = await fullTracksResp.json();
        const tracks = fullTracksData.tracks || [];

        for (const track of tracks) {
            const isrc = track.external_ids?.isrc ? track.external_ids.isrc.replace(/[^A-Z0-9]/g, '') : null;
            const title = track.name;
            const coverArtUrl = track.album?.images?.[0]?.url || null;

            if (title) {
                let songId = null;

                // A. Check if this Release already exists by ISRC (Strongest Link)
                if (isrc) {
                    const existingRelease = await db.release.findUnique({
                        where: { isrc },
                        select: { songId: true }
                    });
                    if (existingRelease) {
                        songId = existingRelease.songId; // Re-use the existing song
                    }
                }

                // B. If no Release, try to find Song by Title + User (Legacy/Manual check)
                if (!songId) {
                    const existingSong = await db.song.findFirst({
                        where: { 
                            title: title, 
                            writers: { some: { userId: user.id } } 
                        },
                        select: { id: true }
                    });
                    if (existingSong) songId = existingSong.id;
                }

                // C. If Song Found (via A or B) -> Ensure Link Exists
                if (songId) {
                    const split = await db.writerSplit.findFirst({
                        where: { songId, userId: user.id }
                    });
                    
                    // If no split (this is the "Re-Claim" magic), create it!
                    if (!split) {
                        await db.writerSplit.create({
                            data: {
                                songId,
                                userId: user.id,
                                percentage: 100,
                                role: 'Composer'
                            }
                        });
                    }
                    
                    // Tag it as spotify source
                    await db.song.update({
                        where: { id: songId },
                        data: { importSource: 'spotify' }
                    });
                } else {
                    // D. If Song Not Found -> Create New Song + Split
                    const newSong = await db.song.create({
                        data: {
                            title,
                            importSource: 'spotify',
                            writers: { create: { userId: user.id, percentage: 100, role: 'Composer' } }
                        }
                    });
                    songId = newSong.id;
                }

                // E. Upsert Release (Update metadata or Create if new)
                if (isrc) {
                    await db.release.upsert({
                        where: { isrc },
                        update: { title, coverArtUrl, songId }, // Ensure it points to the correct song
                        create: {
                            songId,
                            title,
                            isrc,
                            coverArtUrl
                        }
                    });
                } else {
                    // Check duplicate for non-ISRC tracks to avoid spam
                    const existingTitleRelease = await db.release.findFirst({
                        where: { songId, title }
                    });
                    if (!existingTitleRelease) {
                        await db.release.create({
                            data: { songId, title, coverArtUrl }
                        });
                    }
                }
                importCount++;
            }
        }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/songs');
    return { success: true, count: importCount };

  } catch (error) {
    console.error("SPOTIFY IMPORT ERROR:", error);
    return { error: 'Failed to import catalog.' };
  }
}

// 5. Action: Reset Spotify Connection
export async function resetSpotifyConnection() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    // 1. Unlink the User Profile
    await db.user.update({
      where: { id: user.id },
      data: {
        spotifyArtistId: null,
        avatarUrl: null,
      }
    })

    // 2. Remove "WriterSplits" for Spotify-imported songs
    await db.writerSplit.deleteMany({
        where: {
            userId: user.id,
            song: {
                importSource: 'spotify'
            }
        }
    });

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard/songs')
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error("SPOTIFY RESET ERROR:", error);
    return { error: 'Failed to reset Spotify connection.' }
  }
}