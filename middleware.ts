import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialize Response (The "Fail Open" default)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // 2. Environment Variable Check
    // If these are missing on Vercel, we log it and exit gracefully instead of crashing.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Middleware Warning: Supabase keys missing. Authentication disabled.');
      return response; 
    }

    // 3. Initialize Supabase Client
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Update request cookies for the downstream app
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            
            // Re-create the response with the new request headers
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            
            // Set cookies on the response object
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // 4. Validate Session
    // getUser() is safer than getSession() as it validates the auth token against the DB
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 5. Route Protection Logic
    const url = request.nextUrl.clone()
    
    // Check if the user is trying to access a protected area
    if (url.pathname.startsWith('/dashboard')) {
      if (!user) {
        // Redirect unauthenticated users to login
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    }

    // Check if a logged-in user is trying to access public auth pages
    if ((url.pathname === '/login' || url.pathname === '/') && user) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return response

  } catch (error) {
    // 6. Resilience: If Supabase fails, don't crash the site.
    // Log the error to Vercel so we can fix it, but let the user proceed.
    console.error('🔥 Middleware Critical Error:', error)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}