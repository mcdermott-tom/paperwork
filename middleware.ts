import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Log to prove we are alive
  console.log("Middleware is running for:", request.nextUrl.pathname);
  
  // 2. Return immediately (Bypassing all Supabase logic)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}