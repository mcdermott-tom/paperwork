import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Setup the default response (Pass-through)
  // If anything fails, we return this so the site doesn't crash.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // 2. Load and Validate Keys
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Middleware Warning: Missing Supabase Environment Variables');
      return response; 
    }

    // 3. Create the Client
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

    // 4. Check Auth
    // We use getUser() because it validates the JWT signature on the server
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 5. Protected Routes Logic
    const { pathname } = request.nextUrl
    
    // Explicitly list protected roots
    const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/songs')

    if (isProtectedPath && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if ((pathname === '/login' || pathname === '/') && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response

  } catch (e) {
    // 6. CATCH EVERYTHING
    // If Supabase crashes, just let the user through (Fail Open) to prevent a 500 Error
    console.error('Middleware Crash:', e)
    return response
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    // Note: We moved songs to dashboard, but keeping this just in case
    '/songs/:path*', 
  ],
}