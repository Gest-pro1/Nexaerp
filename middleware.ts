import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenStructurallyValid(token?: string): boolean {
  if (!token || token.trim().length < 16) return false;
  const payload = parseJwtPayload(token);
  if (payload && typeof payload.exp === 'number') {
    if (payload.exp * 1000 <= Date.now()) {
      return false;
    }
  }
  return true;
}

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get('nexaerp_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith('/Admin') ||
    pathname.startsWith('/menu-modulos') ||
    pathname.startsWith('/modulos');

  if (isProtectedRoute && !isTokenStructurallyValid(token)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // NEXA-SEC-008: Se a rota for /Admin e o payload JWT indicar explicitamente app_metadata.role != 'admin', redirecionar
  if (pathname.startsWith('/Admin') && token) {
    const payload = parseJwtPayload(token);
    const appRole = payload?.app_metadata?.role;
    if (appRole && appRole !== 'admin') {
      return NextResponse.redirect(new URL('/menu-modulos', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/Admin/:path*', '/menu-modulos/:path*', '/modulos/:path*'],
};
