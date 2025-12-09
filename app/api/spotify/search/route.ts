import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Adjust path to your prisma instance

// 1. Helper to get a temporary "Client Credentials" token from Spotify
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // FIXED: Used correct Spotify Token URL
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  const data = await response.json();
  return data.access_token;
}

// 2. The Search Route
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // A. Get Token & Search Spotify
    const token = await getSpotifyToken();
    
    // FIXED: Used correct Spotify Search URL
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const spotifyData = await spotifyRes.json();
    const tracks = spotifyData.tracks?.items || [];

    // B. Transform & Upsert into DB
    const savedSongs = await Promise.all(
      tracks.map(async (track: any) => {
        const coverArt = track.album.images[0]?.url || "";
        const isrc = track.external_ids?.isrc || null;

        return db.song.upsert({
          where: { spotifyTrackId: track.id },
          update: {
             title: track.name,
             iswc: track.external_ids?.iswc || undefined 
          },
          create: {
            title: track.name,
            spotifyTrackId: track.id,
            // FIXED: Removed 'isrc' here (it belongs to Release, not Song)
            importSource: "spotify_search",
            
            releases: {
              create: {
                title: track.album.name,
                coverArtUrl: coverArt,
                upc: track.external_ids?.upc || undefined,
                isrc: isrc, // Correctly placed on the Release model
              }
            }
          },
          include: {
            releases: true 
          }
        });
      })
    );

    return NextResponse.json({ songs: savedSongs });

  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}