import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, getAdminSessionToken, verifyAdminPassword } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, getAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
