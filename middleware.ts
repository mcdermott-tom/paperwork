import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Default Pass-Through (Fail Open)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // 2. Load Keys
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If keys are missing, stop immediately to prevent crash
    if (!supabaseUrl || !supabaseKey) {
      return response
    }

    // 3. Create Client
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // 4. Check Auth
    // Use getUser() for security
    const { data: { user } } = await supabase.auth.getUser()

    // 5. Simple Route Protection (No Regex)
    const path = request.nextUrl.pathname

    // Only protect /dashboard
    if (path.startsWith('/dashboard')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Redirect logged-in users away from /login
    if ((path === '/login' || path === '/') && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response

  } catch (e) {
    // Failsafe: If anything explodes, just let the request through.
    console.error('Middleware Error:', e)
    return response
  }
}

// Simplified Matcher to reduce Edge Runtime load
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}