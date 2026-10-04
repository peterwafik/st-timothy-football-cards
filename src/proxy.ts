import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only teacher pages and login need session refresh; public cards stay fast.
  matcher: ['/log/:path*', '/adjust/:path*', '/kids/:path*', '/history/:path*', '/settings/:path*', '/login'],
};
