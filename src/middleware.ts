import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export async function middleware(request: NextRequest) {
  // 1. Basic In-Memory Rate Limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  
  if (ip !== 'unknown') {
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);
    
    if (rateData) {
      if (now - rateData.lastReset > RATE_LIMIT_WINDOW_MS) {
        // Reset window
        rateData.count = 1;
        rateData.lastReset = now;
      } else {
        rateData.count++;
        if (rateData.count > MAX_REQUESTS) {
          return new NextResponse('Too Many Requests - Rate Limit Exceeded', { status: 429 });
        }
      }
    } else {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    }
  }

  // 2. Supabase Session Management
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
