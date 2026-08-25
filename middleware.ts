import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('nexaerp_token')?.value 
    || request.headers.get('authorization')?.replace('Bearer ', '');
  
  const isAdminRoute = request.nextUrl.pathname.startsWith('/Admin');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // If trying to access admin without token, redirect to login
  if (isAdminRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/Admin/:path*'],
};
