import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  // Only teacher pages and login need session refresh; public cards stay fast.
  matcher: ['/log/:path*', '/adjust/:path*', '/kids/:path*', '/history/:path*', '/settings/:path*', '/login'],
};
