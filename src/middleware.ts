import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Halaman yang membutuhkan autentikasi
const protectedPrefixes = ['/dashboard'];

// Halaman yang hanya bisa diakses sebelum login
const authOnlyPages = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));
  const isAuthOnly  = authOnlyPages.some(p => pathname === p);

  // Belum login tapi mau buka dashboard → redirect ke login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Sudah login tapi mau buka login/register → redirect ke dashboard
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
