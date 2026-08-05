import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Build an absolute base from request headers to safely parse relative req.url in dev and production
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const url = new URL(req.url, base);
  const search = url.search || '';
  // Redirect using an absolute URL to satisfy NextResponse requirements
  return NextResponse.redirect(`${base}/payment/sucesso${search}`, 307);
}
