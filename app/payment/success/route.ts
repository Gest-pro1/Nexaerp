import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.search || '';
  return NextResponse.redirect(`/payment/sucesso${search}`, 307);
}
